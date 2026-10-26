<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\MarketItem;
use App\Models\MarketPriceSnapshot;
use App\Models\PalutoDish;
use App\Models\PalutoDishIngredient;
use App\Models\PalutoStall;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A Paluto stall's own menu: each dish carries its own ingredient list (BOM)
 * and cooking fee. Ingredient prices are never stored — they're read live from
 * the stall's market so the CMS shows what the dish actually costs there.
 */
class PalutoDishController extends Controller
{
    private const INGREDIENT_LINE_RULES = [
        'ingredients.*.item_id' => 'required|exists:items,id,status,1',
        'ingredients.*.kind' => 'nullable|in:meat,vegetable,condiment,spice',
        'ingredients.*.quantity' => 'required|numeric|min:0.001',
        'ingredients.*.is_optional' => 'boolean',
        'ingredients.*.is_provided' => 'boolean',
        'ingredients.*.note' => 'nullable|string|max:255',
        'ingredients.*.sort_order' => 'nullable|integer|min:0',
    ];

    public function index(Request $request, PalutoStall $stall)
    {
        $status = $request->query('status');

        $dishes = $stall->dishes()
            ->with('recipeType')
            ->withCount('ingredients')
            ->when($status !== null, fn ($q) => $q->where('status', (int) $status))
            ->get();

        return response()->json([
            'stall' => [
                'id' => $stall->id,
                'name' => $stall->name,
                'market_id' => $stall->market_id,
                'market_name' => $stall->market?->name,
                'status' => $stall->status,
            ],
            'dishes' => $dishes->map(fn (PalutoDish $dish) => $this->formatDishSummary($dish))->values(),
        ]);
    }

    public function show(PalutoDish $dish)
    {
        return response()->json($this->formatDish($dish));
    }

    /**
     * Creates a dish on this stall's menu, optionally with its ingredient list in
     * the same request. `from_recipe_id` only borrows the recipe's cover image when
     * none is uploaded — the admin form copies the recipe's ingredients client-side,
     * so the dish is independent of the recipe from the start.
     */
    public function store(Request $request, PalutoStall $stall)
    {
        $data = $request->validate($this->detailRules(creating: true) + [
            'from_recipe_id' => 'nullable|exists:recipes,id',
            'ingredients' => 'sometimes|array',
        ] + self::INGREDIENT_LINE_RULES);

        $ingredients = $data['ingredients'] ?? [];

        if ($error = $this->marketCheckError($ingredients, $stall->market_id)) {
            return $error;
        }

        $disk = $this->disk();
        $path = null;

        if ($request->hasFile('image')) {
            $path = $this->storeImage($request, $data['name']);
        }

        try {
            $dish = DB::transaction(function () use ($stall, $data, $path, $ingredients) {
                $recipeImage = ! empty($data['from_recipe_id'])
                    ? Recipe::whereKey($data['from_recipe_id'])->value('image')
                    : null;

                $dish = PalutoDish::create([
                    'paluto_stall_id' => $stall->id,
                    'name' => trim($data['name']),
                    'description' => $data['description'] ?? null,
                    'image' => $path ?? $recipeImage,
                    'recipe_type_id' => $data['recipe_type_id'] ?? null,
                    'pricing_unit' => $data['pricing_unit'],
                    'base_quantity' => $data['base_quantity'],
                    'rate' => $data['rate'],
                    'minimum_fee' => $data['minimum_fee'] ?? null,
                    'status' => $data['status'] ?? true,
                    'sort_order' => $data['sort_order'] ?? 0,
                ]);

                $this->syncIngredients($dish, $ingredients);

                AuditLogger::log('paluto_dish_created', $dish, $dish->id, null, $dish->toArray() + [
                    'ingredients' => $dish->ingredients()->get()->toArray(),
                ]);

                return $dish;
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk($disk)->delete($path);
            }
            throw $e;
        }

        return response()->json($this->formatDish($dish), 201);
    }

    public function update(Request $request, PalutoDish $dish)
    {
        $data = $request->validate($this->detailRules(creating: false));

        $old = $dish->toArray();
        $disk = $this->disk();
        $newPath = null;

        if ($request->hasFile('image')) {
            $newPath = $this->storeImage($request, $data['name'] ?? $dish->name);
            $data['image'] = $newPath;
        }

        try {
            $dish->update($data);
        } catch (\Throwable $e) {
            if ($newPath) {
                Storage::disk($disk)->delete($newPath);
            }
            throw $e;
        }

        // A dish seeded from a recipe starts out sharing the recipe's image file —
        // only ever delete images this controller uploaded itself.
        if ($newPath && $old['image'] && str_starts_with($old['image'], 'paluto-dishes/')) {
            Storage::disk($disk)->delete($old['image']);
        }

        AuditLogger::log('paluto_dish_updated', $dish, $dish->id, $old, $dish->fresh()->toArray());

        return response()->json($this->formatDish($dish));
    }

    /**
     * Bulk-replaces the dish's ingredient list. Every line the customer would buy
     * (not optional, not provided by the stall) must be an item this stall's
     * market actually carries — otherwise the dish could never be ordered.
     */
    public function updateIngredients(Request $request, PalutoDish $dish)
    {
        $data = $request->validate(['ingredients' => 'present|array'] + self::INGREDIENT_LINE_RULES);
        $ingredients = $data['ingredients'];

        if ($error = $this->marketCheckError($ingredients, $dish->stall->market_id)) {
            return $error;
        }

        $old = $dish->ingredients()->get()->toArray();

        DB::transaction(fn () => $this->syncIngredients($dish, $ingredients));

        AuditLogger::log('paluto_dish_ingredients_updated', $dish, $dish->id, $old, $dish->ingredients()->get()->toArray());

        return response()->json($this->formatDish($dish));
    }

    /**
     * Live price/availability of the given items at this stall's market — lets the
     * CMS show costs for ingredient lines that aren't saved yet (e.g. copied from a
     * recipe), not just items picked from the market-scoped search.
     */
    public function marketPrices(Request $request, PalutoStall $stall)
    {
        $data = $request->validate([
            'item_ids' => 'required|array|max:200',
            'item_ids.*' => 'integer',
        ]);

        $itemIds = collect($data['item_ids'])->unique();

        $snapshots = MarketPriceSnapshot::where('market_id', $stall->market_id)
            ->whereIn('item_id', $itemIds)
            ->get()
            ->keyBy('item_id');

        $carriedItemIds = MarketItem::where('market_id', $stall->market_id)
            ->whereIn('item_id', $itemIds)
            ->pluck('item_id');

        return response()->json($itemIds->map(fn ($itemId) => [
            'item_id' => (int) $itemId,
            'in_market' => $carriedItemIds->contains($itemId),
            'market_price' => $snapshots->get($itemId)?->price,
        ])->values());
    }

    /** Deactivates rather than hard-deletes — dishes are referenced by order history. */
    public function destroy(PalutoDish $dish)
    {
        $old = $dish->toArray();
        $dish->update(['status' => false]);

        AuditLogger::log('paluto_dish_deactivated', $dish, $dish->id, $old, null);

        return response()->json(['message' => 'Dish deactivated.']);
    }

    public function restore(PalutoDish $dish)
    {
        $dish->update(['status' => true]);

        AuditLogger::log('paluto_dish_restored', $dish, $dish->id, null, $dish->toArray());

        return response()->json(['message' => 'Dish restored.']);
    }

    /**
     * Every line the customer pays for (not optional, not provided by the stall)
     * must be an item this stall's market actually carries — otherwise the dish
     * could never be ordered.
     */
    private function marketCheckError(array $ingredients, int $marketId): ?JsonResponse
    {
        $itemIds = collect($ingredients)->pluck('item_id');

        $marketItemIds = MarketItem::where('market_id', $marketId)
            ->whereIn('item_id', $itemIds)
            ->pluck('item_id');

        $notCarried = collect($ingredients)
            ->filter(fn ($row) => ! ($row['is_optional'] ?? false) && ! ($row['is_provided'] ?? false))
            ->reject(fn ($row) => $marketItemIds->contains($row['item_id']))
            ->pluck('item_id')
            ->unique();

        if ($notCarried->isEmpty()) {
            return null;
        }

        $names = Item::whereIn('id', $notCarried)->pluck('name')->join(', ');

        return response()->json([
            'message' => "Not sold at this stall's market: {$names}. Remove them, or mark them optional or provided by the stall.",
        ], 422);
    }

    /** Replaces the dish's ingredient lines with the given ones. */
    private function syncIngredients(PalutoDish $dish, array $ingredients): void
    {
        $items = Item::with('category')->whereIn('id', collect($ingredients)->pluck('item_id'))->get()->keyBy('id');

        PalutoDishIngredient::where('paluto_dish_id', $dish->id)->delete();

        foreach ($ingredients as $index => $ingredient) {
            PalutoDishIngredient::create([
                'paluto_dish_id' => $dish->id,
                'item_id' => $ingredient['item_id'],
                'kind' => RecipeIngredient::kindForCategory($items[$ingredient['item_id']]->category?->name),
                'quantity' => $ingredient['quantity'],
                // Always the item's own selling unit — price is quantity × the
                // item's per-unit market price, with no unit conversion.
                'unit_id' => $items[$ingredient['item_id']]->unit_id,
                'is_optional' => (bool) ($ingredient['is_optional'] ?? false),
                'is_provided' => (bool) ($ingredient['is_provided'] ?? false),
                'note' => $ingredient['note'] ?? null,
                'sort_order' => $ingredient['sort_order'] ?? $index,
            ]);
        }
    }

    private function detailRules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes|required';

        return [
            'name' => "{$required}|string|max:255",
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:4096',
            'recipe_type_id' => 'nullable|exists:recipe_types,id,status,1',
            'pricing_unit' => "{$required}|in:kg,serving",
            'base_quantity' => "{$required}|numeric|min:0.001",
            'rate' => "{$required}|numeric|min:0",
            'minimum_fee' => 'nullable|numeric|min:0',
            'status' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }

    private function storeImage(Request $request, string $name): string
    {
        return $request->file('image')->storeAs(
            'paluto-dishes',
            Str::slug($name).'-'.uniqid().'.'.$request->file('image')->extension(),
            $this->disk(),
        );
    }

    private function formatDishSummary(PalutoDish $dish): array
    {
        return [
            'id' => $dish->id,
            'paluto_stall_id' => $dish->paluto_stall_id,
            'name' => $dish->name,
            'image_url' => $dish->image_full_url,
            'recipe_type' => $dish->recipeType?->name,
            'pricing_unit' => $dish->pricing_unit,
            'base_quantity' => $dish->base_quantity,
            'rate' => $dish->rate,
            'minimum_fee' => $dish->minimum_fee,
            'status' => $dish->status,
            'sort_order' => $dish->sort_order,
            'ingredients_count' => $dish->ingredients_count ?? $dish->ingredients()->count(),
        ];
    }

    /** Full dish, with each ingredient's live price and availability at the stall's market. */
    private function formatDish(PalutoDish $dish): array
    {
        $dish->load(['stall.market', 'recipeType', 'ingredients.item', 'ingredients.unit']);

        $marketId = $dish->stall->market_id;
        $itemIds = $dish->ingredients->pluck('item_id')->unique();

        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)
            ->whereIn('item_id', $itemIds)
            ->get()
            ->keyBy('item_id');

        $carriedItemIds = MarketItem::where('market_id', $marketId)
            ->whereIn('item_id', $itemIds)
            ->pluck('item_id');

        return [
            'id' => $dish->id,
            'paluto_stall_id' => $dish->paluto_stall_id,
            'stall_name' => $dish->stall->name,
            'market_id' => $marketId,
            'market_name' => $dish->stall->market?->name,
            'name' => $dish->name,
            'description' => $dish->description,
            'image_url' => $dish->image_full_url,
            'recipe_type_id' => $dish->recipe_type_id,
            'recipe_type' => $dish->recipeType?->name,
            'pricing_unit' => $dish->pricing_unit,
            'base_quantity' => $dish->base_quantity,
            'rate' => $dish->rate,
            'minimum_fee' => $dish->minimum_fee,
            'status' => $dish->status,
            'sort_order' => $dish->sort_order,
            'ingredients' => $dish->ingredients->map(function (PalutoDishIngredient $ingredient) use ($snapshots, $carriedItemIds) {
                $snapshot = $snapshots[$ingredient->item_id] ?? null;

                return [
                    'id' => $ingredient->id,
                    'item_id' => $ingredient->item_id,
                    'item_name' => $ingredient->item?->name,
                    'kind' => $ingredient->kind,
                    'quantity' => $ingredient->quantity,
                    'unit_id' => $ingredient->unit_id,
                    'unit_name' => $ingredient->unit?->short_name,
                    'is_optional' => $ingredient->is_optional,
                    'is_provided' => $ingredient->is_provided,
                    'note' => $ingredient->note,
                    'sort_order' => $ingredient->sort_order,
                    'in_market' => $carriedItemIds->contains($ingredient->item_id),
                    'market_price' => $snapshot?->price,
                    'is_available' => (bool) ($snapshot?->is_available ?? false),
                ];
            })->values(),
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
