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

        $riders = Rider::query()
            ->with('market:id,name')
            ->when($user->role !== 'super_admin', fn (Builder $q) => $q->where('market_id', $user->market_id))
            ->when($search !== '', function (Builder $q) use ($search) {
                $like = '%'.$search.'%';
                $q->where(fn (Builder $sub) => $sub->where('name', 'like', $like)->orWhere('phone', 'like', $like));
            })
            ->withCount(['orders as active_orders_count' => fn ($q) => $q->whereIn('status', [
                'order_confirmed', 'preparing_items', 'out_for_delivery',
            ])])
            ->orderBy('name')
            ->paginate(20);

        return response()->json($riders);
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

        $riders = Rider::query()
            ->with('market:id,name,latitude,longitude')
            ->where('is_active', true)
            ->when($user->role !== 'super_admin', fn (Builder $q) => $q->where('market_id', $user->market_id))
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'vehicle_type', 'market_id', 'current_latitude', 'current_longitude', 'last_location_update']);

        return response()->json($riders->map(fn (Rider $rider) => [
            'id' => $rider->id,
            'name' => $rider->name,
            'phone' => $rider->phone,
            'vehicle_type' => $rider->vehicle_type,
            'market_name' => $rider->market?->name,
            'latitude' => $rider->current_latitude !== null ? (float) $rider->current_latitude : null,
            'longitude' => $rider->current_longitude !== null ? (float) $rider->current_longitude : null,
            'last_location_update' => $rider->last_location_update,
        ]));
    }

    private function authorizeRiderAccess(Request $request, Rider $rider): void
    {
        $user = $request->user();
        abort_if($user->role !== 'super_admin' && (int) $rider->market_id !== (int) $user->market_id, 403);
    }
}
