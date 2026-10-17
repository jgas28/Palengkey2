<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');

        // Riders this admin can see (own market unless super admin).
        $scoped = fn () => Rider::query()
            ->when($user->role !== 'super_admin', fn (Builder $q) => $q->where('market_id', $user->market_id));
        $delivering = fn (Builder $q) => $q->where('status', 'out_for_delivery');

        $riders = $scoped()
            ->with('market:id,name')
            ->when($search !== '', function (Builder $q) use ($search) {
                $like = '%'.$search.'%';
                $q->where(fn (Builder $sub) => $sub->where('name', 'like', $like)
                    ->orWhere('phone', 'like', $like)
                    ->orWhereHas('market', fn (Builder $m) => $m->where('name', 'like', $like)));
            })
            ->when($status === 'available', fn (Builder $q) => $q->where('is_active', true)->whereDoesntHave('orders', $delivering))
            ->when($status === 'delivering', fn (Builder $q) => $q->where('is_active', true)->whereHas('orders', $delivering))
            ->when($status === 'offline', fn (Builder $q) => $q->where('is_active', false))
            ->withCount([
                'orders as active_orders_count' => fn ($q) => $q->whereIn('status', [
                    'order_confirmed', 'preparing_items', 'out_for_delivery',
                ]),
                'orders as delivering_count' => $delivering,
                'orders as delivered_today_count' => fn ($q) => $q->where('status', 'delivered')
                    ->where('completed_at', '>=', now('Asia/Manila')->startOfDay()->utc()),
            ])
            ->orderBy('name')
            ->paginate(20);

        $onDelivery = $scoped()->where('is_active', true)->whereHas('orders', $delivering)->count();
        $active = $scoped()->where('is_active', true)->count();

        return response()->json([
            ...$riders->toArray(),
            'summary' => [
                'total' => $scoped()->count(),
                'available' => $active - $onDelivery,
                'delivering' => $onDelivery,
                'offline' => $scoped()->where('is_active', false)->count(),
                'delivered_today' => \App\Models\Order::query()
                    ->whereIn('rider_id', $scoped()->select('id'))
                    ->where('status', 'delivered')
                    ->where('completed_at', '>=', now('Asia/Manila')->startOfDay()->utc())
                    ->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === 'super_admin';

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'vehicle_type' => 'required|string|max:50',
            'market_id' => $isSuperAdmin ? 'required|exists:markets,id' : 'nullable',
        ]);

        $marketId = $isSuperAdmin ? (int) $data['market_id'] : $user->market_id;

        if (! $marketId) {
            return response()->json(['message' => 'Your account is not assigned to a market.'], 422);
        }

        $rider = Rider::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'vehicle_type' => $data['vehicle_type'],
            'market_id' => $marketId,
            'is_active' => true,
        ]);

        AuditLogger::log('created', $rider, $rider->id, null, $rider->toArray());

        return response()->json($rider->fresh('market'), 201);
    }

    public function update(Request $request, Rider $rider)
    {
        $this->authorizeRiderAccess($request, $rider);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:30',
            'vehicle_type' => 'sometimes|required|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        $old = $rider->only(array_keys($data));
        $rider->update($data);

        AuditLogger::log('updated', $rider, $rider->id, $old, $data);

        return response()->json($rider->fresh('market'));
    }

    public function tracking(Request $request)
    {
        $user = $request->user();
        $todayStart = now('Asia/Manila')->startOfDay()->utc();

        // Offline riders are listed too (last known position), after the active ones.
        $riders = Rider::query()
            ->with([
                'market:id,name,latitude,longitude',
                'orders' => fn ($q) => $q->whereIn('status', ['preparing_items', 'out_for_delivery'])
                    ->orderByRaw("status = 'out_for_delivery' desc")
                    ->latest('id')
                    ->select('id', 'rider_id', 'order_number', 'status'),
            ])
            ->withCount(['orders as delivered_today_count' => fn ($q) => $q->where('status', 'delivered')
                ->where('completed_at', '>=', $todayStart)])
            ->when($user->role !== 'super_admin', fn (Builder $q) => $q->where('market_id', $user->market_id))
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'vehicle_type', 'is_active', 'market_id', 'current_latitude', 'current_longitude', 'last_location_update']);

        return response()->json($riders->map(function (Rider $rider) {
            $order = $rider->orders->first();

            return [
                'id' => $rider->id,
                'name' => $rider->name,
                'phone' => $rider->phone,
                'vehicle_type' => $rider->vehicle_type,
                'market_name' => $rider->market?->name,
                'latitude' => $rider->current_latitude !== null ? (float) $rider->current_latitude : null,
                'longitude' => $rider->current_longitude !== null ? (float) $rider->current_longitude : null,
                'last_location_update' => $rider->last_location_update,
                'status' => ! $rider->is_active ? 'offline'
                    : ($order?->status === 'out_for_delivery' ? 'delivering' : 'available'),
                'active_order' => $order ? [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                ] : null,
                'active_orders_count' => $rider->orders->count(),
                'delivered_today_count' => $rider->delivered_today_count,
            ];
        }));
    }

    private function authorizeRiderAccess(Request $request, Rider $rider): void
    {
        $user = $request->user();
        abort_if($user->role !== 'super_admin' && (int) $rider->market_id !== (int) $user->market_id, 403);
    }
}
