<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
use App\Services\OrderNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Endpoints for the rider app (palengkey-rider-mobile), ported from the old
 * backend with the same URLs and response shapes so the app works unchanged.
 *
 * Flow: the market admin assigns a rider while the order is "preparing_items";
 * the rider taps Start Delivery (→ out_for_delivery), then Complete with a
 * proof photo (→ delivered). Location fixes are stored on the rider row, which
 * the customer order page polls.
 */
class RiderAppController extends Controller
{
    /** Orders a rider still has to deliver (shown on the dashboard). */
    private const ACTIVE_STATUSES = ['order_confirmed', 'preparing_items', 'out_for_delivery', 'accepted', 'preparing', 'ready'];

    /** Riders can start delivering once the shopper is preparing (legacy statuses kept for old orders). */
    private const START_DELIVERY_STATUSES = ['preparing_items', 'preparing', 'ready'];

    private const DONE_STATUSES = ['delivered', 'completed'];

    public function getDashboard(Request $request)
    {
        $rider = $this->rider($request);
        if (! $rider) {
            return $this->riderNotFound();
        }

        $riderOrders = Order::where('rider_id', $rider->id);
        $active = $this->sortNearestFirst(
            (clone $riderOrders)->with(['items.item.unit', 'market'])->whereIn('status', self::ACTIVE_STATUSES)->latest()->get(),
            $this->origin($request, $rider),
        )->map(fn (Order $order) => $this->formatOrder($order));

        return response()->json([
            'success' => true,
            'data' => [
                'completed_count' => (clone $riderOrders)->whereIn('status', self::DONE_STATUSES)->count(),
                'active_count' => $active->count(),
                'active_orders' => $active,
                'active_order' => $active->first(),
            ],
        ]);
    }

    public function getOrders(Request $request)
    {
        $request->validate(['email' => 'required|email', 'type' => 'required|in:active,completed']);

        $rider = $this->rider($request);
        if (! $rider) {
            return $this->riderNotFound();
        }

        $query = $rider->orders()->with(['items.item.unit', 'market'])
            ->whereIn('status', $request->type === 'completed' ? self::DONE_STATUSES : self::ACTIVE_STATUSES);

        $orders = $this->sortNearestFirst($query->latest()->get(), $this->origin($request, $rider))
            ->map(fn (Order $order) => $this->formatOrder($order));

        return response()->json(['success' => true, 'rider_name' => $rider->name, 'data' => $orders]);
    }

    public function getOrder(Request $request, $id)
    {
        $request->validate(['email' => 'required|email']);

        $rider = $this->rider($request);
        if (! $rider) {
            return $this->riderNotFound();
        }

        $order = Order::with(['items.item.unit', 'market', 'rider'])
            ->where('id', $id)
            ->where('rider_id', $rider->id)
            ->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'can_start_delivery' => $this->canStartDelivery($order),
                'can_track_order' => $order->status === 'out_for_delivery',
                'total_amount' => $order->total_amount,
                'payment_method' => strtoupper((string) $order->payment_method),
                'payment_status' => $order->payment_status,
                'delivery_address' => $order->delivery_address,
                'latitude' => $order->latitude,
                'longitude' => $order->longitude,
                'contact_name' => $order->contact_name,
                'contact_phone' => $order->contact_phone,
                'notes' => $order->notes,
                'created_at' => $order->created_at->format('M d, Y · g:ia'),
                'received_at' => $order->created_at,
                'rider_id' => $order->rider?->id,
                'rider_name' => $order->rider?->name,
                'delivery_photo' => $order->delivery_photo ? Storage::disk($this->disk())->url($order->delivery_photo) : null,
                'timeline' => [
                    'received' => $order->created_at,
                    'confirmed' => $order->accepted_at,
                    'preparing_items' => $order->prepared_at,
                    'delivered' => $order->completed_at,
                    // Legacy keys the app still reads.
                    'accepted' => $order->accepted_at,
                    'prepared' => $order->prepared_at,
                    'ready' => null,
                    'out_for_delivery' => $order->out_for_delivery_at,
                    'completed' => $order->completed_at,
                ],
                'store' => [
                    'name' => $order->market->name ?? 'Palengke Market',
                    'address' => $order->market->address ?? '',
                    'latitude' => $order->market->latitude ?? null,
                    'longitude' => $order->market->longitude ?? null,
                ],
                'items' => $order->items->map(function ($item) {
                    $unit = $item->unit_name ?: ($item->item?->unit?->short_name ?? $item->item?->unit?->name);

                    return [
                        'name' => $item->item_name,
                        'qty' => $item->quantity,
                        'unit' => $unit,
                        'uom' => $unit,
                        'price' => number_format((float) $item->price, 2),
                        'note' => $item->customer_note,
                        'image' => $item->item?->image_full_url,
                    ];
                }),
            ],
        ]);
    }

    /** Rider picks the order up at the market → out for delivery (customer is notified). */
    public function startDelivery(Request $request, Order $order)
    {
        $request->validate(['email' => 'required|email']);

        $rider = $this->rider($request);
        if (! $rider) {
            return $this->riderNotFound();
        }

        if ((int) $order->rider_id !== (int) $rider->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: This order does not belong to you.'], 403);
        }

        if ($order->status !== 'out_for_delivery' && ! $this->canStartDelivery($order)) {
            return response()->json(['success' => false, 'message' => 'This order is not ready for delivery yet — wait until the market is preparing it.'], 422);
        }

        $started = false;

        DB::transaction(function () use ($order, &$started) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'out_for_delivery') {
                return;
            }

            $locked->forceFill([
                'status' => 'out_for_delivery',
                'out_for_delivery_at' => now(),
                'assigned_at' => $locked->assigned_at ?? now(),
            ])->save();
            $started = true;
        });

        $order = Order::with(['items.item.unit', 'market'])->findOrFail($order->id);

        if ($started) {
            OrderNotifier::notifyStatusChange($order, 'out_for_delivery');
        }

        return response()->json([
            'success' => true,
            'message' => 'Delivery tracking started.',
            'data' => $this->formatOrder($order),
        ]);
    }

    /** Proof-of-delivery photo → delivered. COD orders are marked paid. */
    public function deliver(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'proof_image' => 'required|image|max:8192',
            'email' => 'required|email',
        ]);

        $rider = $this->rider($request);
        $order = Order::findOrFail($request->order_id);

        if (! $rider || (int) $order->rider_id !== (int) $rider->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: This order does not belong to you.'], 403);
        }

        if ($order->status !== 'out_for_delivery') {
            return response()->json(['success' => false, 'message' => 'Start delivery before marking this order as delivered.'], 422);
        }

        try {
            $disk = $this->disk();

            if ($order->delivery_photo && Storage::disk($disk)->exists($order->delivery_photo)) {
                Storage::disk($disk)->delete($order->delivery_photo);
            }

            $path = $request->file('proof_image')->store("delivery-proofs/riders/{$rider->id}/orders/{$order->id}", $disk);

            $order->forceFill([
                'status' => 'delivered',
                'completed_at' => now(),
                'delivery_photo' => $path,
                'payment_status' => $order->payment_method === 'cod' ? 'paid' : $order->payment_status,
            ])->save();

            OrderNotifier::notifyStatusChange($order, 'delivered');

            return response()->json([
                'success' => true,
                'message' => 'Order delivered successfully',
                'data' => ['order_id' => $order->id, 'path' => $path],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['success' => false, 'message' => 'Upload failed. Please try again.'], 500);
        }
    }

    public function getProfile(Request $request)
    {
        $rider = $this->rider($request);
        if (! $rider) {
            return response()->json(['success' => false, 'message' => 'Rider profile not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $rider->name,
                'email' => $rider->email,
                'phone' => $rider->phone,
                'vehicle_type' => ucfirst((string) $rider->vehicle_type),
                'is_active' => (bool) $rider->is_active,
                'joined_at' => $rider->created_at?->format('M d, Y'),
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $rider = $this->rider($request);
        if (! $rider) {
            return response()->json(['success' => false, 'message' => 'Rider profile not found.'], 404);
        }

        $rider->update(['name' => $request->name, 'phone' => $request->phone]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully!',
            'data' => ['name' => $rider->name, 'email' => $rider->email, 'phone' => $rider->phone],
        ]);
    }

    /** Foreground location fix from the app (every few seconds while delivering). */
    public function updateLocation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $rider = $this->rider($request);
        if (! $rider) {
            return $this->riderNotFound();
        }

        $rider->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'data' => [
                'latitude' => $rider->current_latitude,
                'longitude' => $rider->current_longitude,
                'updated_at' => $rider->last_location_update,
            ],
        ]);
    }

    /**
     * Location posted by the app's native background-geolocation plugin (can
     * arrive while the app is backgrounded). Rider identity comes from the token,
     * or the X-Rider-Id header for older builds. Stored like updateLocation.
     */
    public function backgroundPing(Request $request)
    {
        $riderId = $request->header('X-Rider-Id');
        $tokenRider = $request->user();

        if ($tokenRider instanceof Rider) {
            if ($riderId !== null && (int) $riderId !== (int) $tokenRider->id) {
                return response()->json(['success' => false, 'message' => 'Rider mismatch.'], 403);
            }
            $riderId = $tokenRider->id;
        }

        $validator = Validator::make(array_merge($request->all(), ['rider_id' => $riderId]), [
            'rider_id' => 'required|integer|exists:riders,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        Rider::whereKey($riderId)->update([
            'current_latitude' => $request->input('latitude'),
            'current_longitude' => $request->input('longitude'),
            'last_location_update' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    private function rider(Request $request): ?Rider
    {
        $user = $request->user();
        if ($user instanceof Rider) {
            return $user;
        }

        $email = $request->input('email', $request->query('email'));

        return $email ? Rider::where('email', $email)->first() : null;
    }

    private function riderNotFound()
    {
        return response()->json(['success' => false, 'message' => 'Rider not found'], 404);
    }

    private function canStartDelivery(Order $order): bool
    {
        return in_array($order->status, self::START_DELIVERY_STATUSES, true);
    }

    private function origin(Request $request, Rider $rider): ?array
    {
        $lat = $request->query('latitude', $request->query('lat', $rider->current_latitude));
        $lng = $request->query('longitude', $request->query('lng', $rider->current_longitude));

        return is_numeric($lat) && is_numeric($lng) ? ['lat' => (float) $lat, 'lng' => (float) $lng] : null;
    }

    private function distanceKm(?array $origin, Order $order): ?float
    {
        if (! $origin || ! is_numeric($order->latitude) || ! is_numeric($order->longitude)) {
            return null;
        }

        $lat = (float) $order->latitude;
        $lng = (float) $order->longitude;
        $dLat = deg2rad($lat - $origin['lat']);
        $dLng = deg2rad($lng - $origin['lng']);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($origin['lat'])) * cos(deg2rad($lat)) * sin($dLng / 2) ** 2;

        return round(6371 * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }

    private function sortNearestFirst($orders, ?array $origin)
    {
        return $orders
            ->each(fn (Order $order) => $order->distance_km = $this->distanceKm($origin, $order))
            ->sort(fn ($a, $b) => (($a->distance_km ?? PHP_FLOAT_MAX) <=> ($b->distance_km ?? PHP_FLOAT_MAX))
                ?: ($b->created_at->timestamp <=> $a->created_at->timestamp))
            ->values();
    }

    private function formatOrder(Order $order): array
    {
        $count = $order->items->count();
        $first = $order->items->first();
        $firstName = $first?->item_name ?? 'Item';
        $firstUnit = $first ? ($first->unit_name ?: ($first->item?->unit?->short_name ?? $first->item?->unit?->name)) : null;
        $label = $firstName.($firstUnit ? " ({$firstUnit})" : '');
        $distance = $order->distance_km ?? null;

        return [
            'id' => $order->id,
            'order_no' => $order->order_number ?? ('#'.$order->id),
            'amount' => '&#8369;'.number_format((float) $order->total_amount, 2),
            'status' => $order->status,
            'status_label' => strtoupper(str_replace('_', ' ', $order->status)),
            'time_label' => $order->created_at->format('M d, Y - g:ia'),
            'pickup_name' => $order->market->name ?? 'Palengke Station',
            'dropoff_address' => $order->delivery_address ?? 'No address provided',
            'items_summary' => $count > 1 ? $label.' + '.($count - 1).' others' : $label,
            'total_items' => $count,
            'distance_km' => $distance,
            'distance' => $distance === null ? null : ($distance < 1 ? round($distance * 1000).' m' : number_format($distance, 1).' km'),
            'can_start_delivery' => $this->canStartDelivery($order),
            'can_track_order' => $order->status === 'out_for_delivery',
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
