<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderRecipeBundle;
use App\Models\Rider;
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
        'preparing_items' => ['out_for_delivery', 'order_confirmed'],
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

    private const ASSIGNABLE_STATUSES = ['order_received', 'order_confirmed', 'preparing_items'];

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
            ->with(['customer:id,fname,lname,email,phone', 'rider:id,name,phone'])
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['orders' => $orders, 'counts' => $counts]);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);

        $order->load(['items', 'customer', 'rider', 'voucher', 'cashlessPayment', 'recipeBundles.stall']);

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
                'message' => 'Rider can only be assigned before the order is out for delivery.',
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
