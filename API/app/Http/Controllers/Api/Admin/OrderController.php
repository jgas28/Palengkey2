<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRecipeBundle;
use App\Models\Rider;
use App\Models\Setting;
use App\Support\BulkPricing;
use App\Services\AuditLogger;
use App\Services\OrderNotifier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /** Forward/backward progression only — cancellation goes through cancel() so it always carries a reason. */
    private const TRANSITIONS = [
        'order_received' => ['order_confirmed'],
        'order_confirmed' => ['preparing_items', 'order_received'],
        // Out for delivery is set by the rider app when the rider picks the order up.
        'preparing_items' => ['order_confirmed'],
        'out_for_delivery' => ['delivered', 'preparing_items'],
        'delivered' => ['out_for_delivery'],
    ];

    private const TIMESTAMP_COLUMN = [
        'order_confirmed' => 'accepted_at',
        'preparing_items' => 'prepared_at',
        'out_for_delivery' => 'out_for_delivery_at',
        'delivered' => 'completed_at',
    ];

    /** Forward/backward only, same shape as TRANSITIONS above but for a
     * stall's kitchen progress on one "Cook for Me" bundle within an order. */
    private const COOKING_TRANSITIONS = [
        'pending' => ['preparing'],
        'preparing' => ['cooking', 'pending'],
        'cooking' => ['ready_for_pickup', 'preparing'],
        'ready_for_pickup' => ['out_for_delivery', 'cooking'],
        'out_for_delivery' => ['delivered', 'ready_for_pickup'],
        'delivered' => ['out_for_delivery'],
    ];

    /** Riders are assigned once the shopper is preparing the items (same as the old admin). */
    private const ASSIGNABLE_STATUSES = ['preparing_items'];

    private const CANCEL_BLOCKED_STATUSES = ['out_for_delivery', 'delivered', 'cancelled'];

    public function index(Request $request)
    {
        $user = $request->user();
        $marketId = $this->resolveMarketId($request, $user);
        $status = $request->query('status');
        $search = trim((string) $request->query('search', ''));

        $baseQuery = Order::query()
            ->when($marketId, fn (Builder $q) => $q->where('market_id', $marketId))
            ->when($request->boolean('reservations_only'), fn (Builder $q) => $q->where('is_reservation', true))
            ->when($search !== '', function (Builder $q) use ($search) {
                $like = '%'.$search.'%';
                $q->where(function (Builder $sub) use ($like) {
                    $sub->where('order_number', 'like', $like)
                        ->orWhere('contact_name', 'like', $like)
                        ->orWhere('contact_phone', 'like', $like)
                        ->orWhereHas('customer', fn ($cq) => $cq->where('email', 'like', $like));
                });
            });

        $counts = (clone $baseQuery)->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')->pluck('aggregate', 'status');

        $orders = (clone $baseQuery)
            ->with(['customer:id,fname,lname,email,phone', 'rider:id,name,phone', 'market:id,name'])
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(20);

        // Header cards: scheduled "order later" work still to do, and today's order value.
        $scoped = Order::query()->when($marketId, fn (Builder $q) => $q->where('market_id', $marketId));
        $todayStart = now('Asia/Manila')->startOfDay()->timezone(config('app.timezone'));
        $summary = [
            'order_later' => (clone $scoped)->where('is_reservation', true)
                ->whereNotIn('status', ['delivered', 'completed', 'cancelled'])->count(),
            'today_value' => round((float) (clone $scoped)->where('created_at', '>=', $todayStart)
                ->where('status', '!=', 'cancelled')->sum('total_amount'), 2),
        ];

        return response()->json(['orders' => $orders, 'counts' => $counts, 'summary' => $summary]);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $order->load(['items', 'customer', 'rider', 'voucher', 'cashlessPayment', 'recipeBundles.stall', 'market:id,name', 'shopper:id,name']);

        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $data = $request->validate(['status' => 'required|string']);
        $newStatus = $data['status'];

        $allowed = self::TRANSITIONS[$order->status] ?? [];
        if (! in_array($newStatus, $allowed, true)) {
            return response()->json([
                'message' => "Cannot move an order from \"{$order->status}\" to \"{$newStatus}\".",
            ], 422);
        }

        $oldStatus = $order->status;

        DB::transaction(function () use ($order, $newStatus) {
            $order->status = $newStatus;

            $column = self::TIMESTAMP_COLUMN[$newStatus] ?? null;
            if ($column) {
                $order->{$column} = now();
            }

            $order->save();
        });

        AuditLogger::log('order_status_updated', $order, $order->id, ['status' => $oldStatus], ['status' => $newStatus]);
        OrderNotifier::notifyStatusChange($order, $newStatus);

        return response()->json(['message' => 'Order updated.', 'order' => $order->fresh()]);
    }

    /** Updates one "Cook for Me" bundle's kitchen progress within an order — independent of the order's own delivery-logistics status. */
    /** Items can change only while the order is still being put together at the market. */
    private const EDITABLE_ITEM_STATUSES = ['pending_payment', 'order_received', 'order_confirmed', 'preparing_items'];

    /**
     * Fix a line when the market can't fill it as ordered — e.g. only 1.5 kg left,
     * or the vendor's price changed. Totals (service fee, voucher) are recalculated.
     */
    public function updateItem(Request $request, Order $order, OrderItem $orderItem)
    {
        $this->authorizeOrderAccess($request, $order);
        abort_if($orderItem->order_id !== $order->id, 404);
        abort_unless(in_array($order->status, self::EDITABLE_ITEM_STATUSES, true), 422, 'Items can only be edited before the order leaves preparation.');

        $data = $request->validate([
            'quantity' => 'required|numeric|min:0.001|max:99999',
            'price' => 'required|numeric|min:0|max:999999.99',
            'reason' => 'nullable|string|max:255',
        ]);

        $before = $order->total_amount;

        DB::transaction(function () use ($order, $orderItem, $data) {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $line = OrderItem::whereKey($orderItem->id)->where('order_id', $lockedOrder->id)->lockForUpdate()->firstOrFail();
            $old = $line->only(['quantity', 'price', 'subtotal']);

            $quantity = round((float) $data['quantity'], 3);
            $price = round((float) $data['price'], 2);
            // Weighed lines become one pack of the new weight; counted lines keep a whole count.
            $weighed = BulkPricing::isWeightUnit((object) ['short_name' => $line->unit_name]);
            $line->update([
                'quantity' => $quantity,
                'item_quantity' => $weighed ? 1 : max(1, (int) round($quantity)),
                'weight_kg' => $weighed ? $quantity : null,
                'price' => $price,
                'price_at_purchase' => $price,
                'subtotal' => round($quantity * $price, 2),
            ]);

            $this->recalculateOrderTotals($lockedOrder);

            AuditLogger::log('order_item_updated', $line, $line->id, $old, $line->only(['quantity', 'price', 'subtotal']) + ['reason' => $data['reason'] ?? null]);
        });

        return $this->itemChangeResponse($order, $before, 'Item updated and totals recalculated.');
    }

    /** Drop a line the market couldn't supply (out of stock). The last line can't go — cancel instead. */
    public function destroyItem(Request $request, Order $order, OrderItem $orderItem)
    {
        $this->authorizeOrderAccess($request, $order);
        abort_if($orderItem->order_id !== $order->id, 404);
        abort_unless(in_array($order->status, self::EDITABLE_ITEM_STATUSES, true), 422, 'Items can only be removed before the order leaves preparation.');
        abort_if($order->items()->count() <= 1, 422, 'This is the last item — cancel the order instead.');

        $reason = $request->validate(['reason' => 'nullable|string|max:255'])['reason'] ?? null;
        $before = $order->total_amount;

        DB::transaction(function () use ($order, $orderItem, $reason) {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $line = OrderItem::whereKey($orderItem->id)->where('order_id', $lockedOrder->id)->lockForUpdate()->firstOrFail();

            AuditLogger::log('order_item_removed', $line, $line->id, $line->only(['item_name', 'quantity', 'price', 'subtotal']), ['reason' => $reason]);
            $line->delete();

            $this->recalculateOrderTotals($lockedOrder);
        });

        return $this->itemChangeResponse($order, $before, 'Item removed and totals recalculated.');
    }

    /** Same formula as checkout: items + delivery (net + VAT) + service + cooking − voucher − bulk subsidy. */
    private function recalculateOrderTotals(Order $order): void
    {
        $order->loadMissing('voucher');

        $subtotal = round((float) $order->items()->sum('subtotal'), 2);
        $serviceFee = Setting::calculateServiceFee($subtotal);
        $deliveryGross = round((float) $order->delivery_fee + (float) $order->vat, 2);
        $bulkSubsidy = min((float) ($order->bulk_delivery_subsidy ?? 0), $deliveryGross);
        $cookingFee = (float) ($order->paluto_cooking_fee ?? 0);
        $voucherDiscount = 0.0;

        if ($order->voucher && ! $order->voucher->redemptionBlockReason((int) $order->customer_id, $subtotal, (int) $order->market_id)) {
            $voucherDiscount = $order->voucher->calculateTotalDiscount($subtotal, $serviceFee, $deliveryGross - $bulkSubsidy);
        }

        $order->forceFill([
            'subtotal' => $subtotal,
            'service_fee' => $serviceFee,
            'voucher_discount' => $voucherDiscount,
            'total_amount' => max(0, round($subtotal + $deliveryGross + $serviceFee + $cookingFee - $voucherDiscount - $bulkSubsidy, 2)),
        ])->save();

        if ($order->voucher_id) {
            DB::table('voucher_usages')->where('order_id', $order->id)
                ->update(['discount_amount' => $voucherDiscount, 'updated_at' => now()]);
        }
    }

    /** Includes the total's change so staff know to refund/collect the difference on paid orders. */
    private function itemChangeResponse(Order $order, mixed $totalBefore, string $message)
    {
        $fresh = $order->fresh(['items', 'customer', 'rider', 'voucher', 'cashlessPayment', 'recipeBundles.stall']);
        $difference = round((float) $fresh->total_amount - (float) $totalBefore, 2);
        $isPaid = in_array($fresh->payment_status, ['paid', 'completed', 'succeeded'], true);

        return response()->json([
            'message' => $message,
            'total_difference' => $difference,
            'refund_due' => $isPaid && $difference < 0 ? abs($difference) : 0,
            'order' => $fresh,
        ]);
    }

    /**
     * Market staff record what the vendor actually charged (after haggling) and
     * why. Blank vendor_price clears it. Feeds the vendor-savings report.
     */
    public function updateItemVendorPrice(Request $request, Order $order, OrderItem $orderItem)
    {
        $this->authorizeOrderAccess($request, $order);
        abort_if($orderItem->order_id !== $order->id, 404);
        abort_unless(OrderItem::hasVendorColumns(), 422, 'Run the latest migrations to record vendor prices.');

        $data = $request->validate([
            'vendor_price' => 'nullable|numeric|min:0|max:9999999',
            'vendor_note' => 'nullable|string|max:500',
        ]);

        $old = $orderItem->only(['vendor_price', 'vendor_note']);

        $orderItem->update([
            'vendor_price' => $data['vendor_price'] ?? null,
            'vendor_note' => $data['vendor_note'] ?? null,
            'vendor_price_by' => $request->user()->id,
            'vendor_price_at' => now(),
        ]);

        AuditLogger::log('order_item_vendor_price_updated', $orderItem, $orderItem->id, $old, $orderItem->only(['vendor_price', 'vendor_note']));

        return response()->json(['message' => 'Vendor price saved.', 'item' => $orderItem->fresh()]);
    }

    public function updateRecipeBundleCookingStatus(
        Request $request,
        Order $order,
        OrderRecipeBundle $recipeBundle,
    ) {
        $this->authorizeOrderAccess($request, $order);

        abort_if($recipeBundle->order_id !== $order->id, 404);
        abort_if($recipeBundle->paluto_stall_id === null, 422, 'This bundle has no stall — it has no cooking status.');

        $data = $request->validate(['cooking_status' => 'required|string']);
        $newStatus = $data['cooking_status'];

        $allowed = self::COOKING_TRANSITIONS[$recipeBundle->cooking_status] ?? [];
        if (! in_array($newStatus, $allowed, true)) {
            return response()->json([
                'message' => "Cannot move this bundle from \"{$recipeBundle->cooking_status}\" to \"{$newStatus}\".",
            ], 422);
        }

        $oldStatus = $recipeBundle->cooking_status;
        $recipeBundle->update(['cooking_status' => $newStatus]);

        AuditLogger::log(
            'order_recipe_bundle_cooking_status_updated',
            $recipeBundle,
            $recipeBundle->id,
            ['cooking_status' => $oldStatus],
            ['cooking_status' => $newStatus],
        );

        return response()->json([
            'message' => 'Cooking status updated.',
            'recipe_bundle' => $recipeBundle->fresh(),
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $request->validate(['reason' => 'required|string|min:5|max:500']);

        if (in_array($order->status, self::CANCEL_BLOCKED_STATUSES, true)) {
            return response()->json(['message' => 'This order can no longer be cancelled.'], 422);
        }

        $oldStatus = $order->status;

        DB::transaction(function () use ($order, $request) {
            $order->status = 'cancelled';
            $order->cancelled_at = now();
            $order->cancellation_reason = $request->reason;
            $order->save();
        });

        AuditLogger::log('order_cancelled', $order, $order->id, ['status' => $oldStatus], ['reason' => $request->reason]);
        OrderNotifier::notifyCancelled($order, $request->reason);

        return response()->json(['message' => "Order #{$order->order_number} has been cancelled.", 'order' => $order->fresh()]);
    }

    public function assignRider(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $data = $request->validate(['rider_id' => 'required|exists:riders,id']);

        if (! in_array($order->status, self::ASSIGNABLE_STATUSES, true)) {
            return response()->json([
                'message' => 'A rider can be assigned only while the order is being prepared.',
            ], 422);
        }

        $rider = Rider::findOrFail($data['rider_id']);
        $user = $request->user();
        if ($user->role !== 'super_admin' && $rider->market_id !== $user->market_id) {
            return response()->json(['message' => 'This rider is not assigned to your market.'], 403);
        }

        $order->update(['rider_id' => $rider->id, 'assigned_at' => now()]);
        AuditLogger::log('order_rider_assigned', $order, $order->id, null, ['rider_id' => $rider->id]);

        return response()->json(['message' => 'Rider assigned.', 'order' => $order->fresh('rider')]);
    }

    /**
     * Streams a two-page PDF: a legal-size picking list for market staff,
     * followed by a grid of 3"x2" stick-on item labels (name, weight/UOM,
     * packed date) for bagging produce before dispatch. Not a carrier
     * shipping label — no barcode or waybill.
     */
    public function print(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $order->loadMissing('items.item.unit');

        $pdf = Pdf::loadView('admin.orders.print', compact('order'));

        return $pdf->stream("Order-{$order->order_number}.pdf");
    }

    /** Staff who can be assigned to shop an order: market admins/owners of the order's market. */
    public function activeShoppers(Request $request)
    {
        $user = $request->user();
        $marketId = $user->role === 'super_admin' ? $request->query('market_id') : $user->market_id;

        $shoppers = \App\Models\User::query()
            ->whereIn('role', ['admin', 'owner'])
            ->when($marketId, fn ($q) => $q->where('market_id', $marketId))
            ->orderBy('name')
            ->get(['id', 'name', 'market_id']);

        return response()->json($shoppers);
    }

    public function assignShopper(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        if (! \Illuminate\Support\Facades\Schema::hasColumn('orders', 'shopper_id')) {
            return response()->json(['message' => 'Run the latest migration to enable shopper assignment.'], 422);
        }

        $data = $request->validate(['shopper_id' => 'nullable|integer|exists:users,id']);
        $shopper = isset($data['shopper_id']) ? \App\Models\User::findOrFail($data['shopper_id']) : null;

        if ($shopper && $request->user()->role !== 'super_admin' && $shopper->market_id !== $request->user()->market_id) {
            return response()->json(['message' => 'This staff member is not in your market.'], 403);
        }

        $old = $order->shopper_id;
        $order->update(['shopper_id' => $shopper?->id]);
        AuditLogger::log('order_shopper_assigned', $order, $order->id, ['shopper_id' => $old], ['shopper_id' => $shopper?->id]);

        return response()->json(['message' => $shopper ? 'Shopper assigned.' : 'Shopper removed.', 'order' => $order->fresh('shopper:id,name')]);
    }

    public function activeRiders(Request $request)
    {
        $user = $request->user();

        $riders = Rider::where('is_active', true)
            ->when($user->role !== 'super_admin', fn (Builder $q) => $q->where('market_id', $user->market_id))
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'vehicle_type']);

        return response()->json($riders);
    }

    private function resolveMarketId(Request $request, $user): ?int
    {
        if ($user->role === 'super_admin') {
            $marketId = $request->query('market_id');

            return $marketId ? (int) $marketId : null;
        }

        return $user->market_id;
    }

    private function authorizeOrderAccess(Request $request, Order $order): void
    {
        $user = $request->user();
        abort_if($user->role !== 'super_admin' && (int) $order->market_id !== (int) $user->market_id, 403);
    }
}
