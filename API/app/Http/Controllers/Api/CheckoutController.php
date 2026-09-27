<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\CartRecipeBundle;
use App\Models\Customer;
use App\Models\ItemPrice;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use App\Models\Order;
use App\Models\PalutoStall;
use App\Models\PalutoStallRecipe;
use App\Models\Setting;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Services\InvoiceSeriesService;
use App\Services\PayMongoService;
use App\Support\PriceDisplay;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    private function orderLaterSlots(): array
    {
        return [
            ['value' => '07:00', 'label' => '7:00 AM'],
            ['value' => '08:00', 'label' => '8:00 AM'],
            ['value' => '09:00', 'label' => '9:00 AM'],
            ['value' => '10:00', 'label' => '10:00 AM'],
            ['value' => '11:00', 'label' => '11:00 AM'],
            ['value' => '12:00', 'label' => '12:00 PM'],
        ];
    }

    private function orderLaterSlotValues(): array
    {
        return array_column($this->orderLaterSlots(), 'value');
    }

    private function normalizeOrderLaterSlot(?string $slot): string
    {
        $slot = $slot ?: '07:00';

        return in_array($slot, $this->orderLaterSlotValues(), true) ? $slot : '07:00';
    }

    private function orderLaterSlotLabel(?string $slot): string
    {
        $slot = $this->normalizeOrderLaterSlot($slot);

        foreach ($this->orderLaterSlots() as $orderLaterSlot) {
            if ($orderLaterSlot['value'] === $slot) {
                return $orderLaterSlot['label'];
            }
        }

        return '7:00 AM';
    }

    private function buildOrderLaterDeliveryTime($item, ?string $slot = null)
    {
        $slot = $this->normalizeOrderLaterSlot($slot);
        $base = $item?->getNextAvailableDeliverySlot() ?? now('Asia/Manila')->addDay()->startOfDay();

        return $base->copy()->setTimeFromTimeString($slot);
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'address_id' => 'required|exists:customer_addresses,id',
            'payment_method' => 'required|in:cod,paymongo,qrph,card,bpi',
            'item_ids' => 'required_without:recipe_bundle_ids|array',
            'item_ids.*' => 'exists:cart_items,id',
            'recipe_bundle_ids' => 'nullable|array',
            'recipe_bundle_ids.*' => 'exists:cart_recipe_bundles,id',
            'voucher_code' => 'nullable|string|max:50',
            'order_later_slot' => 'nullable|in:'.implode(',', $this->orderLaterSlotValues()),
            'notes' => 'nullable|string|max:500',
        ]);

        /** @var Customer $customer */
        $customer = $request->user();
        $selectedItemIds = collect($data['item_ids'] ?? [])->map(fn ($id) => (int) $id)->values();
        $selectedBundleIds = collect($data['recipe_bundle_ids'] ?? [])->map(fn ($id) => (int) $id)->values();
        $isQrphPayment = $data['payment_method'] === 'qrph';
        $isBpiPayment = $data['payment_method'] === 'bpi';
        // Both qrph and bpi are redirect/QR-first flows: the order starts as
        // pending_payment and the cart isn't cleared until the payment record
        // is actually created below.
        $isCashlessPayment = $isQrphPayment || $isBpiPayment;

        // Cash on Delivery no longer requires ID verification before the first order.

        $order = DB::transaction(function () use ($customer, $data, $selectedItemIds, $selectedBundleIds, $isCashlessPayment) {
            $cart = $customer->cart()->first();

            if (! $cart) {
                abort(422, 'Cart not found');
            }

            $selectedItems = CartItem::where('cart_id', $cart->id)
                ->whereIn('id', $selectedItemIds)
                ->with(['item.unit', 'market'])
                ->lockForUpdate()
                ->get();

            $selectedBundles = CartRecipeBundle::where('cart_id', $cart->id)
                ->whereIn('id', $selectedBundleIds)
                ->with(['items.item.unit'])
                ->lockForUpdate()
                ->get();

            if ($selectedItems->isEmpty() && $selectedBundles->isEmpty()) {
                abort(422, 'No valid items selected for checkout');
            }

            $bundleIngredientItems = $selectedBundles->flatMap(fn (CartRecipeBundle $bundle) => $bundle->items);

            if ($selectedBundles->isNotEmpty() && $bundleIngredientItems->isEmpty()) {
                abort(422, 'Selected Paluto recipe has no available ingredients.');
            }

            $allMarketIds = $selectedItems->pluck('market_id')
                ->merge($bundleIngredientItems->pluck('market_id'))
                ->filter()
                ->unique();

            if ($allMarketIds->count() > 1) {
                abort(422, 'Cannot checkout items from different markets.');
            }

            // Paluto recipes always cook at one stall per order (it's one delivery trip).
            $bundleStallIds = $selectedBundles->pluck('paluto_stall_id')->filter()->unique();
            if ($bundleStallIds->count() > 1) {
                abort(422, 'All Paluto recipes in one order must use the same stall.');
            }

            $address = $customer->addresses()->where('id', $data['address_id'])->firstOrFail();

            $market = $selectedItems->first()->market ?? Market::find($allMarketIds->first());

            if (! $market) {
                abort(422, 'Market not found for the selected cart contents.');
            }

            $distanceKm = $this->calculateDistance(
                $market->latitude, $market->longitude, $address->latitude, $address->longitude
            );

            $deliveryFeeTotal = $this->calculateDeliveryFee($distanceKm);
            $deliveryVat = round($deliveryFeeTotal * 0.12, 2);
            $deliveryNet = round($deliveryFeeTotal - $deliveryVat, 2);

            $marketIds = $allMarketIds;
            $productIds = $selectedItems->pluck('item_id')
                ->merge($bundleIngredientItems->pluck('item_id'))
                ->unique();

            $snapshots = MarketPriceSnapshot::whereIn('market_id', $marketIds)
                ->whereIn('item_id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy(fn ($s) => $s->market_id.'-'.$s->item_id);

            $marketItemPivots = DB::table('market_items')
                ->whereIn('market_id', $marketIds)
                ->whereIn('item_id', $productIds)
                ->get(['item_id', 'market_id', 'cutoff_time', 'cutoff_timezone'])
                ->keyBy(fn ($row) => $row->item_id.'-'.$row->market_id);

            $subtotal = 0;
            $validatedItems = [];
            $isReservation = false;

            foreach ($selectedItems as $cartItem) {
                // Past-cutoff items are allowed, but become order-later requests —
                // they skip the live-availability check below since the market may
                // have closed/marked items unavailable for today by the time the
                // reservation is fulfilled tomorrow; the cart's last known price
                // is used instead of requiring a live snapshot.
                $item = $cartItem->item;
                $itemPivot = $marketItemPivots[$cartItem->item_id.'-'.$cartItem->market_id] ?? null;
                $isPastCutoff = (bool) $item?->isPastCutoffForMarketData($itemPivot, $market);
                if ($isPastCutoff) {
                    $isReservation = true;
                }

                $key = $cartItem->market_id.'-'.$cartItem->item_id;
                $snapshot = $snapshots[$key] ?? null;

                if (! $snapshot && ! $isPastCutoff) {
                    abort(422, "{$cartItem->item->name} is no longer available");
                }

                $unit = $cartItem->item?->unit;
                $itemQty = max(1, (int) ($cartItem->item_quantity ?? 1));
                $hasWeightSelection = $this->isWeightUnit($unit);
                $weightKg = $hasWeightSelection
                    ? (float) ($cartItem->weight_kg ?: ($cartItem->quantity / $itemQty))
                    : 0;

                $effectivePrice = $snapshot->price
                    ?? ItemPrice::where('market_id', $cartItem->market_id)
                        ->where('item_id', $cartItem->item_id)
                        ->latest('id')
                        ->value('price')
                    ?? $cartItem->price;

                $price = number_format(PriceDisplay::markedUp($effectivePrice), 2, '.', '');
                $priceEach = $hasWeightSelection
                    ? $this->priceForWeight($unit, (float) $price, $weightKg)
                    : (float) $price;
                $qty = $hasWeightSelection
                    ? $this->orderQuantityForWeight($unit, $weightKg, $itemQty)
                    : $itemQty;

                $itemSubtotal = $priceEach * $itemQty;
                $subtotal += $itemSubtotal;

                $validatedItems[] = [
                    'item_id' => $cartItem->item_id,
                    'item_name' => $cartItem->item->name,
                    'unit_name' => $cartItem->item->unit->short_name ?? null,
                    'quantity' => $qty,
                    'price' => $price,
                    'price_at_purchase' => $price,
                    'subtotal' => $itemSubtotal,
                    'customer_note' => $cartItem->customer_note,
                ];
            }

            // Paluto: rebuild each selected recipe bundle's ingredient lines from live
            // prices (same snapshot pattern as the loop above), re-verify the stall still
            // cooks the recipe and is accepting orders, and recompute the cooking fee from
            // the live rate/minimum_fee — never trust the cart's cached preview values.
            $validatedBundles = [];
            $palutoCookingFee = 0;
            $palutoStallId = null;

            foreach ($selectedBundles as $bundle) {
                $bundleItems = [];
                $bundleIngredientsSubtotal = 0;

                foreach ($bundle->items as $ingredientItem) {
                    $key = $ingredientItem->market_id.'-'.$ingredientItem->item_id;
                    $snapshot = $snapshots[$key] ?? null;

                    $effectivePrice = $snapshot->price
                        ?? ItemPrice::where('market_id', $ingredientItem->market_id)
                            ->where('item_id', $ingredientItem->item_id)
                            ->latest('id')
                            ->value('price');

                    if ($effectivePrice === null) {
                        abort(422, "{$ingredientItem->item->name} is no longer available");
                    }

                    $unitPrice = number_format(PriceDisplay::markedUp($effectivePrice), 2, '.', '');
                    $qty = (float) $ingredientItem->quantity;
                    $lineSubtotal = round($unitPrice * $qty, 2);
                    $bundleIngredientsSubtotal += $lineSubtotal;

                    $bundleItems[] = [
                        'item_id' => $ingredientItem->item_id,
                        'item_name' => $ingredientItem->item->name,
                        'unit_name' => $ingredientItem->item->unit->short_name ?? null,
                        'quantity' => $qty,
                        'price' => $unitPrice,
                        'price_at_purchase' => $unitPrice,
                        'subtotal' => $lineSubtotal,
                        'customer_note' => $ingredientItem->customer_note,
                    ];
                }

                $subtotal += $bundleIngredientsSubtotal;

                $stall = null;
                $stallRecipe = null;
                $cookingFee = 0;
                $rateAtPurchase = null;

                if ($bundle->paluto_stall_id) {
                    $stall = PalutoStall::where('id', $bundle->paluto_stall_id)
                        ->lockForUpdate()
                        ->first();

                    if (! $stall || ! $stall->status || ! $stall->is_accepting_orders) {
                        abort(422, "The stall for \"{$bundle->recipe_name}\" is no longer accepting orders.");
                    }

                    $stallRecipe = PalutoStallRecipe::where('paluto_stall_id', $stall->id)
                        ->where('recipe_id', $bundle->recipe_id)
                        ->lockForUpdate()
                        ->first();

                    if (! $stallRecipe || ! $stallRecipe->status) {
                        abort(422, "The stall no longer cooks \"{$bundle->recipe_name}\".");
                    }

                    $rateAtPurchase = (float) $stallRecipe->rate;
                    $cookingFee = round(max($rateAtPurchase * (float) $bundle->quantity, (float) ($stallRecipe->minimum_fee ?? 0)), 2);
                    $palutoCookingFee += $cookingFee;
                    $palutoStallId = $stall->id;
                }

                $validatedBundles[] = [
                    'recipe_id' => $bundle->recipe_id,
                    'recipe_name' => $bundle->recipe_name,
                    'paluto_stall_id' => $stall?->id,
                    'stall_name' => $stall?->name,
                    'quantity' => $bundle->quantity,
                    'pricing_unit' => $bundle->pricing_unit,
                    'rate_at_purchase' => $rateAtPurchase,
                    'cooking_fee' => $cookingFee,
                    'items' => $bundleItems,
                ];
            }

            $isPaluto = ! empty($validatedBundles);

            $serviceFee = Setting::calculateServiceFee($subtotal);

            $voucherDiscount = 0;
            $appliedVoucher = null;

            if (! empty($data['voucher_code'])) {
                $voucher = Voucher::where('code', strtoupper(trim($data['voucher_code'])))
                    ->lockForUpdate()
                    ->first();

                if (! $voucher) {
                    throw ValidationException::withMessages(['voucher_code' => 'Voucher code not found.']);
                }

                $blockReason = $voucher->redemptionBlockReason($customer->id, $subtotal, $market->id);

                if ($blockReason) {
                    throw ValidationException::withMessages(['voucher_code' => $blockReason]);
                }

                $voucherDiscount = $voucher->calculateTotalDiscount($subtotal, $serviceFee, $deliveryFeeTotal);
                $appliedVoucher = $voucher;
            }

            $grandTotal = max(0, round($subtotal + $deliveryFeeTotal + $serviceFee + $palutoCookingFee - $voucherDiscount, 2));

            $scheduledDeliveryTime = null;
            $deliverySlot = null;

            if ($isReservation) {
                $reservationItem = $selectedItems->first(function ($cartItem) use ($marketItemPivots, $market) {
                    $pivot = $marketItemPivots[$cartItem->item_id.'-'.$cartItem->market_id] ?? null;

                    return $cartItem->item?->isPastCutoffForMarketData($pivot, $market);
                });
                $orderLaterSlot = $this->normalizeOrderLaterSlot($data['order_later_slot'] ?? null);
                $scheduledDeliveryTime = $this->buildOrderLaterDeliveryTime($reservationItem?->item, $orderLaterSlot);
                $deliverySlot = 'Order Later '.$this->orderLaterSlotLabel($orderLaterSlot);
            }

            do {
                $orderNumber = 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
            } while (Order::where('order_number', $orderNumber)->exists());

            $seriesNumber = InvoiceSeriesService::generateSeriesNumber($market->id);

            $order = Order::create([
                'order_number' => $orderNumber,
                'invoice_series_number' => $seriesNumber,
                'customer_id' => $customer->id,
                'market_id' => $market->id,
                'status' => $isCashlessPayment ? 'pending_payment' : 'order_received',
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'contact_name' => $address->contact_name,
                'contact_phone' => $address->contact_phone,
                'delivery_address' => $address->address,
                'latitude' => $address->latitude,
                'longitude' => $address->longitude,

                'subtotal' => round($subtotal, 2),
                'delivery_fee' => $deliveryNet,
                'vat' => $deliveryVat,
                'service_fee' => $serviceFee,
                'voucher_discount' => $voucherDiscount,
                'voucher_code' => $appliedVoucher?->code,
                'voucher_id' => $appliedVoucher?->id,
                'total_amount' => $grandTotal,
                'distance_meters' => round($distanceKm * 1000),

                'is_reservation' => $isReservation,
                'scheduled_delivery_time' => $scheduledDeliveryTime,
                'delivery_slot' => $deliverySlot,
                'notes' => $data['notes'] ?? null,

                'order_type' => $isPaluto ? 'paluto' : 'standard',
                'paluto_stall_id' => $palutoStallId,
                'paluto_cooking_fee' => round($palutoCookingFee, 2),
            ]);

            foreach ($validatedItems as $item) {
                $order->items()->create($item);
            }

            foreach ($validatedBundles as $bundleData) {
                $orderBundle = $order->recipeBundles()->create([
                    'recipe_id' => $bundleData['recipe_id'],
                    'recipe_name' => $bundleData['recipe_name'],
                    'paluto_stall_id' => $bundleData['paluto_stall_id'],
                    'stall_name' => $bundleData['stall_name'],
                    'quantity' => $bundleData['quantity'],
                    'pricing_unit' => $bundleData['pricing_unit'],
                    'rate_at_purchase' => $bundleData['rate_at_purchase'],
                    'cooking_fee' => $bundleData['cooking_fee'],
                ]);

                foreach ($bundleData['items'] as $bundleItem) {
                    $order->items()->create($bundleItem + ['order_recipe_bundle_id' => $orderBundle->id]);
                }
            }

            if ($appliedVoucher) {
                VoucherUsage::create([
                    'voucher_id' => $appliedVoucher->id,
                    'customer_id' => $customer->id,
                    'order_id' => $order->id,
                    'discount_amount' => $voucherDiscount,
                ]);

                $appliedVoucher->increment('used_count');
            }

            $parts = explode('-', $seriesNumber);
            $runningNumber = (int) end($parts);
            InvoiceSeriesService::recordSeriesNumber($market->id, $runningNumber, $order->id);

            if (! $isCashlessPayment) {
                $this->clearSelectedCart($selectedItemIds, $selectedBundleIds);
            }

            return $order->load(['items', 'recipeBundles']);
        });

        // Order/status-change notification events aren't wired up yet — no listeners
        // exist until the Notifications feature (Phase 1 step 6) is built, so firing
        // them here would be a silent no-op. Revisit once that step lands.

        $qrph = null;
        if ($isQrphPayment) {
            try {
                $cashless = app(PayMongoService::class)->createQrphPayment($order);
            } catch (\Throwable $e) {
                \Log::error('Failed to create QR Ph payment for order '.$order->order_number, ['message' => $e->getMessage()]);
                $this->removeUnpaidCashlessOrder($order);

                return response()->json(['message' => 'QR Ph payment could not be started. Please try again.'], 422);
            }

            if (! $cashless || ! $cashless->qr_url) {
                \Log::error('QR Ph payment missing QR image for order '.$order->order_number);
                $this->removeUnpaidCashlessOrder($order);

                return response()->json(['message' => 'PayMongo did not return a QR code. Please try again.'], 422);
            }

            $this->clearSelectedCart($selectedItemIds, $selectedBundleIds);

            $qrph = ['qr_url' => $cashless->qr_url, 'reference' => $cashless->reference, 'status' => $cashless->status];
        }

        $bpi = null;
        if ($isBpiPayment) {
            try {
                $cashless = app(PayMongoService::class)->createBpiPayment($order, route('api.bpi.return', $order));
            } catch (\Throwable $e) {
                \Log::error('Failed to create BPI payment for order '.$order->order_number, ['message' => $e->getMessage()]);
                $this->removeUnpaidCashlessOrder($order);

                return response()->json(['message' => 'BPI payment could not be started. Please try again.'], 422);
            }

            if (! $cashless || ! $cashless->redirect_url) {
                \Log::error('BPI payment missing redirect URL for order '.$order->order_number);
                $this->removeUnpaidCashlessOrder($order);

                return response()->json(['message' => 'BPI did not return a redirect URL. Please try again.'], 422);
            }

            $this->clearSelectedCart($selectedItemIds, $selectedBundleIds);

            $bpi = ['redirect_url' => $cashless->redirect_url, 'reference' => $cashless->reference, 'status' => $cashless->status];
        }

        return response()->json([
            'message' => $order->is_reservation
                ? 'Order later request placed successfully. Delivery is scheduled for '.($order->scheduled_delivery_time ? $order->scheduled_delivery_time->format('M d, h:i A') : 'the selected time').'.'
                : 'Order placed successfully',
            'order' => $order->fresh(['items', 'recipeBundles', 'cashlessPayment']),
            'qrph' => $qrph,
            'bpi' => $bpi,
            ...$customer->verificationFlags(),
        ], 201);
    }

    /** @param Collection $selectedItemIds
     *  @param Collection $selectedBundleIds */
    private function clearSelectedCart($selectedItemIds, $selectedBundleIds): void
    {
        CartItem::whereIn('id', $selectedItemIds)->delete();

        if ($selectedBundleIds->isNotEmpty()) {
            CartItem::whereIn('cart_recipe_bundle_id', $selectedBundleIds)->delete();
            CartRecipeBundle::whereIn('id', $selectedBundleIds)->delete();
        }
    }

    private function removeUnpaidCashlessOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $voucherUsage = VoucherUsage::where('order_id', $order->id)->first();

            if ($voucherUsage) {
                Voucher::whereKey($voucherUsage->voucher_id)->where('used_count', '>', 0)->decrement('used_count');
                $voucherUsage->delete();
            }

            $order->cashlessPayment()->delete();
            $order->items()->delete();
            $order->recipeBundles()->delete();
            $order->delete();
        });
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

    private function orderQuantityForWeight($unit, float $weightKg, int $itemQty): float
    {
        return round($this->priceQuantityForWeight($unit, $weightKg) * max(1, $itemQty), 3);
    }

    private function priceForWeight($unit, float $unitPrice, float $weightKg): float
    {
        return round($unitPrice * $this->priceQuantityForWeight($unit, $weightKg), 2);
    }

    private function normalizeUnitLabel(string $unit): string
    {
        return preg_replace('/[^a-z]/', '', strtolower(trim($unit))) ?? '';
    }

    public function deliveryFee(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $marketId = $request->query('market_id');

        if (! $lat || ! $lng) {
            return response()->json(['fee' => 0, 'distance_km' => 0, 'eta_min' => 0, 'eta_max' => 0, 'debug' => 'Missing coordinates']);
        }

        $market = $marketId ? Market::find($marketId) : null;

        if (! $market) {
            return response()->json(['fee' => 0, 'distance_km' => 0, 'eta_min' => 0, 'eta_max' => 0, 'debug' => 'Market not found.']);
        }

        $distance = $this->calculateDistance($market->latitude, $market->longitude, $lat, $lng);
        $fee = $this->calculateDeliveryFee($distance);

        $etaMin = (int) ceil($distance * config('delivery.eta_min_minutes_per_km', 5));
        $etaMax = (int) ceil($distance * config('delivery.eta_max_minutes_per_km', 10));

        return response()->json([
            'fee' => round($fee, 2),
            'distance_km' => round($distance, 2),
            'eta_min' => $etaMin,
            'eta_max' => $etaMax,
            'market_name' => $market->name,
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function calculateDeliveryFee($distance): float
    {
        $baseFee = (float) Setting::get('delivery_base_fee', 40);
        $baseDistance = (float) Setting::get('delivery_base_distance', 3);
        $incrementFee = (float) Setting::get('delivery_increment_fee', 15);
        $incrementDistance = (float) Setting::get('delivery_increment_distance', 1);

        if ($distance <= $baseDistance) {
            return $baseFee;
        }

        $extra = $distance - $baseDistance;
        $units = ceil($extra / $incrementDistance);

        return $baseFee + ($units * $incrementFee);
    }
}
