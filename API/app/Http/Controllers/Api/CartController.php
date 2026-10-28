<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CartRecipeBundle;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use App\Models\PalutoDish;
use App\Models\PalutoDishIngredient;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Support\BulkPricing;
use App\Support\MarketAvailability;
use App\Support\PriceDisplay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    private const CART_RELATIONS = [
        'items.item.unit',
        'recipeBundles.recipe',
        'recipeBundles.dish',
        'recipeBundles.stall',
        'recipeBundles.items.item.unit',
    ];

    /**
     * A cart belongs to an authenticated customer, or — for a signed-out
     * visitor — to the frontend's stable per-install device id (sent as the
     * X-Device-Id header on every request; src/utils/deviceId.ts). Guest
     * carts are merged into the customer's own cart on login/register
     * (CustomerAuthController::mergeGuestCart).
     */
    private function resolveCart(Request $request): Cart
    {
        $customer = $request->user('sanctum');

        if ($customer) {
            return Cart::firstOrCreate(['customer_id' => $customer->id]);
        }

        $deviceId = $request->header('X-Device-Id') ?: $request->input('device_id');

        if (! $deviceId) {
            abort(422, 'Missing device id.');
        }

        return Cart::firstOrCreate(['device_id' => $deviceId]);
    }

    public function show(Request $request)
    {
        $cart = $this->resolveCart($request);

        $selectedIds = $request->query('item_ids');
        if (is_string($selectedIds)) {
            $selectedIds = explode(',', $selectedIds);
        }

        $cart->load([
            'items' => function ($query) use ($selectedIds) {
                // Recipe-ingredient lines are rendered via recipe_bundles below, not
                // the flat items list — exclude them here to avoid double-counting.
                $query->whereNull('cart_recipe_bundle_id');
                if (! empty($selectedIds)) {
                    $query->whereIn('id', $selectedIds);
                }
            },
            'items.item.unit',
            'items.item.type',
            'items.item.category',
            'recipeBundles.recipe',
            'recipeBundles.dish',
            'recipeBundles.stall',
            'recipeBundles.items.item.unit',
        ]);

        return $this->formatCart($cart);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.125|max:100',
            'market_id' => 'required|exists:markets,id',
            'weight' => 'nullable|numeric|min:0|max:10',
            'weight_kg' => 'nullable|numeric|min:0|max:10',
            'customer_note' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $data) {
            $cart = $this->resolveCart($request);
            $cart->refresh();

            $snapshot = MarketPriceSnapshot::where('market_id', $data['market_id'])
                ->where('item_id', $data['item_id'])
                ->lockForUpdate()
                ->first();

            if (! $snapshot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not available in this market',
                ], 422);
            }

            $itemModel = Item::with('unit')->findOrFail($data['item_id']);
            $hasWeightSelection = $this->isWeightUnit($itemModel->unit);
            $basePrice = (float) $snapshot->price;
            $requestedWeight = $data['weight_kg'] ?? $data['weight'] ?? null;
            $requestedWeight = $requestedWeight !== null ? (float) $requestedWeight : null;
            $effectiveWeight = $hasWeightSelection ? round(max(0.125, $requestedWeight ?? 1.0), 3) : 1.0;
            $basePrice = number_format($basePrice, 2, '.', '');
            $itemQty = max(1, (int) round((float) $data['quantity']));
            $storedQuantity = $hasWeightSelection
                ? $this->storedQuantityForUnit($effectiveWeight, $itemQty)
                : $itemQty;
            $customerNote = isset($data['customer_note']) && trim($data['customer_note']) !== ''
                ? trim(htmlspecialchars($data['customer_note']))
                : null;

            // Upsert by (item, market, weight, note) — different variations get
            // separate rows instead of merging. Recipe-ingredient lines (tagged with a
            // cart_recipe_bundle_id) are never merged into via this plain add-item flow.
            $item = CartItem::where('cart_id', $cart->id)
                ->where('item_id', $data['item_id'])
                ->where('market_id', $data['market_id'])
                ->where('weight_kg', $effectiveWeight)
                ->where('customer_note', $customerNote)
                ->whereNull('cart_recipe_bundle_id')
                ->lockForUpdate()
                ->first();

            if ($item) {
                $newItemQty = min(((int) ($item->item_quantity ?? 1)) + $itemQty, 100);
                $newStoredQuantity = $hasWeightSelection
                    ? $this->storedQuantityForUnit($effectiveWeight, $newItemQty)
                    : $newItemQty;

                $item->update([
                    'quantity' => $newStoredQuantity,
                    'item_quantity' => $newItemQty,
                    'price' => $basePrice,
                ]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'item_id' => $data['item_id'],
                    'quantity' => $storedQuantity,
                    'item_quantity' => $itemQty,
                    'price' => $basePrice,
                    'market_id' => $data['market_id'],
                    'weight_kg' => $effectiveWeight,
                    'customer_note' => $customerNote,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatCart($cart->fresh('items.item.unit'), asArray: true),
            ]);
        });
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
            'customer_note' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $cartItem, $data) {
            $cart = $this->resolveCart($request);

            if ($cartItem->cart_id !== $cart->id) {
                abort(403, 'Unauthorized action.');
            }

            // Recipe-ingredient lines are quantity-controlled by the bundle's scaling
            // (add-recipe/remove-bundle), not editable individually here.
            if ($cartItem->cart_recipe_bundle_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This item is part of a Paluto recipe. Update the recipe quantity instead.',
                ], 422);
            }

            $snapshot = MarketPriceSnapshot::where('market_id', $cartItem->market_id)
                ->where('item_id', $cartItem->item_id)
                ->lockForUpdate()
                ->first();

            if (! $snapshot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Price not found for this item in this market',
                ], 422);
            }

            $itemModel = Item::with('unit')->findOrFail($cartItem->item_id);
            $hasWeightSelection = $this->isWeightUnit($itemModel->unit);

            $basePrice = (float) $snapshot->price;
            $weight = $hasWeightSelection ? ((float) ($cartItem->weight_kg ?: 1.0)) : 1.0;
            $itemQty = max(1, (int) $data['quantity']);
            $storedQuantity = $hasWeightSelection
                ? $this->storedQuantityForUnit($weight, $itemQty)
                : $itemQty;

            $cartItem->update([
                'quantity' => $storedQuantity,
                'item_quantity' => $itemQty,
                'price' => number_format($basePrice, 2, '.', ''),
                ...(array_key_exists('customer_note', $data)
                    ? ['customer_note' => $data['customer_note'] !== null && trim($data['customer_note']) !== ''
                        ? trim(htmlspecialchars($data['customer_note']))
                        : null]
                    : []),
            ]);

            return $this->formatCart($cart->fresh(['items.item.unit']));
        });
    }

    public function remove(Request $request, CartItem $cartItem)
    {
        $cart = $this->resolveCart($request);

        if ($cartItem->cart_id !== $cart->id) {
            abort(403, 'Unauthorized action.');
        }

        // Recipe-ingredient lines come out as a whole bundle via removeRecipeBundle(),
        // not one ingredient at a time.
        if ($cartItem->cart_recipe_bundle_id) {
            return response()->json([
                'success' => false,
                'message' => 'This item is part of a Paluto recipe. Remove the recipe instead.',
            ], 422);
        }

        $cartItem->delete();

        return $this->formatCart($cart->fresh('items.item.unit'));
    }

    /**
     * Buy Raw: adds a catalog recipe's ingredients to the cart as one bundle (tagged
     * cart_recipe_bundle_id), scaled to the requested quantity. No stall, no cooking
     * fee — cooked orders go through addPalutoDish() from a stall's own menu.
     */
    public function addRecipe(Request $request)
    {
        $data = $request->validate([
            'recipe_id' => 'required|exists:recipes,id,status,1',
            'market_id' => 'required|exists:markets,id',
            'quantity' => 'required|numeric|min:0.1|max:100',
            'customer_note' => 'nullable|string|max:500',
            // Which ingredients the customer unchecked.
            'excluded_ingredient_ids' => 'nullable|array',
            'excluded_ingredient_ids.*' => 'integer',
        ]);

        return DB::transaction(function () use ($request, $data) {
            $recipe = Recipe::with('ingredients.item.unit')->findOrFail($data['recipe_id']);
            $excludedIds = collect($data['excluded_ingredient_ids'] ?? []);
            $quantity = round((float) $data['quantity'], 3);

            return $this->addIngredientBundle(
                $request,
                ingredients: $recipe->ingredients->reject(fn ($ingredient) => $excludedIds->contains($ingredient->id)),
                marketId: (int) $data['market_id'],
                scale: $quantity / max(0.001, (float) $recipe->base_quantity),
                customerNote: $data['customer_note'] ?? null,
                bundleAttributes: [
                    'recipe_id' => $recipe->id,
                    'recipe_name' => $recipe->name,
                    'quantity' => $quantity,
                    'pricing_unit' => $recipe->pricing_unit,
                    'cooking_fee' => 0,
                ],
            );
        });
    }

    /**
     * Cook for Me: adds one dish from a stall's menu as a bundle — the dish's own
     * ingredient list, priced at the stall's market, minus what the stall provides
     * itself — plus the stall's live cooking fee.
     */
    public function addPalutoDish(Request $request)
    {
        $data = $request->validate([
            'paluto_dish_id' => 'required|exists:paluto_dishes,id,status,1',
            'quantity' => 'required|numeric|min:0.1|max:100',
            'customer_note' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $data) {
            $dish = PalutoDish::with(['stall', 'ingredients.item.unit'])->findOrFail($data['paluto_dish_id']);
            $stall = $dish->stall;

            if (! $stall->status || ! $stall->is_accepting_orders) {
                return response()->json([
                    'success' => false,
                    'message' => "{$stall->name} is not accepting orders right now.",
                ], 422);
            }

            $quantity = round((float) $data['quantity'], 3);

            return $this->addIngredientBundle(
                $request,
                ingredients: $dish->ingredients->reject(fn ($ingredient) => $ingredient->is_provided),
                marketId: $stall->market_id,
                scale: $quantity / max(0.001, (float) $dish->base_quantity),
                customerNote: $data['customer_note'] ?? null,
                bundleAttributes: [
                    'paluto_dish_id' => $dish->id,
                    'recipe_name' => $dish->name,
                    'paluto_stall_id' => $stall->id,
                    'stall_name' => $stall->name,
                    'quantity' => $quantity,
                    'pricing_unit' => $dish->pricing_unit,
                    'rate_at_purchase' => $dish->rate,
                    'cooking_fee' => $dish->cookingFeeFor($quantity),
                ],
            );
        });
    }

    /**
     * Shared by Buy Raw and Cook for Me: prices each ingredient line at the market,
     * fails if a required one isn't sold there, then creates the bundle and its
     * scaled cart lines. Optional ingredients with no market price are skipped.
     *
     * @param  Collection<int, RecipeIngredient|PalutoDishIngredient>  $ingredients
     */
    private function addIngredientBundle(
        Request $request,
        Collection $ingredients,
        int $marketId,
        float $scale,
        ?string $customerNote,
        array $bundleAttributes,
    ) {
        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)
            ->whereIn('item_id', $ingredients->pluck('item_id')->unique())
            ->lockForUpdate()
            ->get()
            ->keyBy('item_id');

        foreach ($ingredients as $ingredient) {
            if (! $ingredient->is_optional && ! isset($snapshots[$ingredient->item_id])) {
                return response()->json([
                    'success' => false,
                    'message' => "{$ingredient->item->name} is not available in this market right now.",
                ], 422);
            }
        }

        if ($ingredients->every(fn ($ingredient) => ! isset($snapshots[$ingredient->item_id]))) {
            return response()->json([
                'success' => false,
                'message' => 'None of these ingredients are available in this market right now.',
            ], 422);
        }

        $cart = $this->resolveCart($request);
        $cart->refresh();

        $bundle = CartRecipeBundle::create(['cart_id' => $cart->id] + $bundleAttributes);

        $customerNote = $customerNote !== null && trim($customerNote) !== ''
            ? trim(htmlspecialchars($customerNote))
            : null;

        foreach ($ingredients as $ingredient) {
            $snapshot = $snapshots[$ingredient->item_id] ?? null;

            if (! $snapshot) {
                continue;
            }

            $hasWeightSelection = $this->isWeightUnit($ingredient->item?->unit);
            $scaledQty = round((float) $ingredient->quantity * $scale, 3);

            CartItem::create([
                'cart_id' => $cart->id,
                'cart_recipe_bundle_id' => $bundle->id,
                'item_id' => $ingredient->item_id,
                'quantity' => max(0.001, $scaledQty),
                'item_quantity' => 1,
                'price' => number_format((float) $snapshot->price, 2, '.', ''),
                'market_id' => $marketId,
                'weight_kg' => $hasWeightSelection ? max(0.001, $scaledQty) : null,
                'customer_note' => $customerNote,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatCart($cart->fresh(self::CART_RELATIONS), asArray: true),
        ], 201);
    }

    public function removeRecipeBundle(Request $request, CartRecipeBundle $bundle)
    {
        $cart = $this->resolveCart($request);

        if ($bundle->cart_id !== $cart->id) {
            abort(403, 'Unauthorized action.');
        }

        DB::transaction(function () use ($bundle) {
            CartItem::where('cart_recipe_bundle_id', $bundle->id)->delete();
            $bundle->delete();
        });

        return $this->formatCart($cart->fresh(self::CART_RELATIONS));
    }

    public function clear(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart->items()->delete();
        $cart->recipeBundles()->delete();

        return response()->json(['message' => 'Cart cleared']);
    }

    /** @return JsonResponse|array */
    private function formatCart(Cart $cart, bool $asArray = false)
    {
        $this->applyLivePrices($cart);

        $total = 0;

        // Recipe-ingredient lines are rendered inside recipe_bundles below, not the flat
        // items list — excluded here regardless of which eager-load path called us.
        $flatItems = $cart->items->whereNull('cart_recipe_bundle_id')->values();

        $marketIds = $flatItems->pluck('market_id')->filter()->unique()->values();
        $itemIds = $flatItems->pluck('item_id')->unique()->values();

        $marketItemPivots = DB::table('market_items')
            ->whereIn('market_id', $marketIds)
            ->whereIn('item_id', $itemIds)
            ->get(['item_id', 'market_id', 'cutoff_time', 'cutoff_timezone', 'is_available', ...MarketAvailability::columns()])
            ->keyBy(fn ($row) => $row->item_id.'-'.$row->market_id);

        $markets = Market::whereIn('id', $marketIds)->get()->keyBy('id');

        // Bulk tier — evaluated over the lines in this response (the whole cart, or
        // just the selection when item_ids is passed), same as checkout will.
        $flatItems->loadMissing('item.category');
        $bulk = BulkPricing::evaluate($flatItems->map(fn (CartItem $item) => [
            'item' => $item->item,
            'weight_kg' => $this->lineWeightKg($item),
        ]));
        $bulkSavings = 0.0;

        $items = $flatItems->map(function (CartItem $item) use (&$total, &$bulkSavings, $marketItemPivots, $markets, $bulk) {
            $itemQty = (int) ($item->item_quantity ?? $item->quantity);
            $unit = $item->item?->unit;
            $hasWeightSelection = $this->isWeightUnit($unit);
            $weightKg = $hasWeightSelection
                ? (float) ($item->weight_kg ?: ($item->quantity / max($itemQty, 1)))
                : 1.0;
            $isBulk = $bulk[$item->item_id]['qualifies'] ?? false;
            $regularUnitPrice = PriceDisplay::markedUp($item->price);
            $displayUnitPrice = $isBulk ? BulkPricing::unitPrice($item->item, $item->price) : $regularUnitPrice;
            $priceEach = $hasWeightSelection
                ? $this->priceForWeight($unit, $displayUnitPrice, $weightKg)
                : $displayUnitPrice;
            $subtotal = round($priceEach * $itemQty, 2);
            $total = round((float) $total + $subtotal, 2);

            if ($isBulk) {
                $regularEach = $hasWeightSelection ? $this->priceForWeight($unit, $regularUnitPrice, $weightKg) : $regularUnitPrice;
                $bulkSavings = round($bulkSavings + ($regularEach * $itemQty) - $subtotal, 2);
            }

            $pivot = $marketItemPivots[$item->item_id.'-'.$item->market_id] ?? null;
            $market = $markets[$item->market_id] ?? null;

            return [
                'id' => $item->id,
                'item_id' => $item->item_id,
                'name' => $item->item->name,
                'image' => $item->item->image_full_url,
                'unit' => $item->item->unit->short_name ?? null,
                'price' => number_format($priceEach, 2, '.', ''),
                'unit_price' => number_format($displayUnitPrice, 2, '.', ''),
                'base_unit_price' => number_format((float) $item->price, 2, '.', ''),
                'quantity' => $itemQty,
                'type' => $item->item->type?->name,
                'category' => $item->item->category?->name,
                'weight_kg' => $hasWeightSelection ? $weightKg : null,
                'customer_note' => $item->customer_note,
                'item_quantity' => $itemQty,
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'cutoff_time' => $item->item->getCutoffTimeStringForMarketData($pivot, $market),
                'is_cutoff' => $item->item->isPastCutoffForMarketData($pivot, $market),
                // Live state: an admin may mark it out of stock after it was added.
                ...MarketAvailability::forItem((bool) ($pivot?->is_available && $item->item->status), $pivot),
                'is_bulk' => $isBulk,
                'regular_unit_price' => number_format($regularUnitPrice, 2, '.', ''),
                'bulk_min_kg' => $bulk[$item->item_id]['threshold_kg'] ?? null,
            ];
        });

        $bundleMarketId = null;

        $recipeBundles = $cart->recipeBundles->map(function (CartRecipeBundle $bundle) use (&$total, &$bundleMarketId) {
            $ingredientsSubtotal = 0;
            $bundleMarketId ??= $bundle->items->first()->market_id ?? null;

            $ingredients = $bundle->items->map(function (CartItem $item) use (&$ingredientsSubtotal) {
                $unit = $item->item?->unit;
                $hasWeightSelection = $this->isWeightUnit($unit);
                $displayUnitPrice = PriceDisplay::markedUp($item->price);
                $priceEach = $hasWeightSelection
                    ? $this->priceForWeight($unit, $displayUnitPrice, (float) $item->weight_kg)
                    : $displayUnitPrice;
                $qty = $hasWeightSelection ? (float) $item->weight_kg : (float) $item->quantity;
                $subtotal = round($priceEach * ($hasWeightSelection ? 1 : $qty), 2);
                $ingredientsSubtotal = round($ingredientsSubtotal + $subtotal, 2);

                return [
                    'id' => $item->id,
                    'item_id' => $item->item_id,
                    'name' => $item->item->name,
                    'unit' => $item->item->unit->short_name ?? null,
                    'quantity' => $item->quantity,
                    'item_quantity' => $item->quantity,
                    'subtotal' => number_format($subtotal, 2, '.', ''),
                ];
            });

            // Same as checkout: the dish's current rate, not the one saved when added.
            $dish = $bundle->paluto_dish_id ? $bundle->dish : null;
            $liveDish = $dish && $dish->status && (int) $dish->paluto_stall_id === (int) $bundle->paluto_stall_id;
            $cookingFee = $liveDish ? (float) $dish->cookingFeeFor((float) $bundle->quantity) : (float) $bundle->cooking_fee;
            $rate = $liveDish ? $dish->rate : $bundle->rate_at_purchase;
            $bundleSubtotal = round($ingredientsSubtotal + $cookingFee, 2);
            $total = round((float) $total + $bundleSubtotal, 2);

            return [
                'id' => $bundle->id,
                'recipe_id' => $bundle->recipe_id,
                'paluto_dish_id' => $bundle->paluto_dish_id,
                'recipe_name' => $bundle->recipe_name,
                'image' => $bundle->dish?->image_full_url ?? $bundle->recipe?->image_full_url,
                'paluto_stall_id' => $bundle->paluto_stall_id,
                'stall_name' => $bundle->stall_name,
                'is_accepting_orders' => $bundle->stall?->is_accepting_orders ?? null,
                'quantity' => $bundle->quantity,
                'pricing_unit' => $bundle->pricing_unit,
                'rate_at_purchase' => $rate,
                'cooking_fee' => number_format($cookingFee, 2, '.', ''),
                'ingredients' => $ingredients,
                'ingredients_subtotal' => number_format($ingredientsSubtotal, 2, '.', ''),
                'subtotal' => number_format($bundleSubtotal, 2, '.', ''),
                'market_id' => $bundle->items->first()->market_id ?? null,
            ];
        });

        $payload = [
            'items' => $items,
            'recipe_bundles' => $recipeBundles,
            'bulk' => [
                'active' => BulkPricing::anyQualifies($bulk),
                'voucher_code' => BulkPricing::VOUCHER_CODE,
                'delivery_subsidy_cap' => number_format(BulkPricing::subsidyCap(), 2, '.', ''),
                'savings' => number_format($bulkSavings, 2, '.', ''),
                // Every bulk-eligible item in the cart and how close it is.
                'items' => collect($bulk)->map(fn ($entry, $itemId) => [
                    'item_id' => $itemId,
                    'name' => $entry['name'],
                    'total_kg' => $entry['total_kg'],
                    'threshold_kg' => $entry['threshold_kg'],
                    'qualifies' => $entry['qualifies'],
                ])->values(),
            ],
            'total' => number_format($total, 2, '.', ''),
            'market_id' => ($flatItems->first()->market_id ?? null) ?? $bundleMarketId,
        ];

        return $asArray ? $payload : response()->json($payload);
    }

    /** Total kg on one cart line (per-piece weight × pieces); 0 for non-weight items. */
    /**
     * Show every line at its market's current price (checkout charges the live
     * price too), not the price it had when added. Lines without a live price
     * (out of stock / unavailable) keep their last one; they can't be checked out.
     */
    private function applyLivePrices(Cart $cart): void
    {
        $lines = $cart->items->concat($cart->recipeBundles->flatMap(fn (CartRecipeBundle $bundle) => $bundle->items));

        if ($lines->isEmpty()) {
            return;
        }

        $snapshots = MarketPriceSnapshot::whereIn('market_id', $lines->pluck('market_id')->filter()->unique())
            ->whereIn('item_id', $lines->pluck('item_id')->unique())
            ->get(['market_id', 'item_id', 'price'])
            ->keyBy(fn ($snapshot) => $snapshot->market_id.'-'.$snapshot->item_id);

        foreach ($lines as $line) {
            $live = $snapshots[$line->market_id.'-'.$line->item_id] ?? null;

            if ($live) {
                $line->price = number_format((float) $live->price, 2, '.', '');
            }
        }
    }

    private function lineWeightKg(CartItem $item): float
    {
        if (! $this->isWeightUnit($item->item?->unit)) {
            return 0.0;
        }

        $itemQty = max(1, (int) ($item->item_quantity ?? 1));
        $weightKg = (float) ($item->weight_kg ?: ($item->quantity / $itemQty));

        return round($weightKg * $itemQty, 3);
    }

    private function isWeightUnit($unit): bool
    {
        $label = $this->normalizeUnitLabel($unit?->short_name ?? $unit?->name ?? '');

        return in_array($label, ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'g', 'gr', 'gram', 'grams'], true);
    }

    private function priceQuantityForWeight($unit, float $weightKg): float
    {
        $label = $this->normalizeUnitLabel($unit?->short_name ?? $unit?->name ?? '');

        return in_array($label, ['g', 'gr', 'gram', 'grams'], true)
            ? round(max(0, $weightKg) * 1000, 3)
            : round(max(0, $weightKg), 3);
    }

    private function storedQuantityForUnit(float $weightKg, int $itemQty): float
    {
        return round(max(0.125, $weightKg) * max(1, $itemQty), 3);
    }

    private function priceForWeight($unit, float $unitPrice, float $weightKg): float
    {
        return round($unitPrice * $this->priceQuantityForWeight($unit, $weightKg), 2);
    }

    private function normalizeUnitLabel(string $unit): string
    {
        return preg_replace('/[^a-z]/', '', strtolower(trim($unit))) ?? '';
    }
}
