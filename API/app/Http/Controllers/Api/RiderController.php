<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Only the customer-facing live-tracking endpoint is built here — the rider
 * mobile-app surface (/rider/*) isn't consumed by the Palengkey2.0 SPA and is
 * out of Phase 1 scope.
 */
class RiderController extends Controller
{
    public function getRiderLocationForOrder(Request $request, int $orderId)
    {
        $customer = $request->user();
        $order = Order::with('rider')->findOrFail($orderId);

        if ($order->customer_id !== $customer->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: This order does not belong to you.',
            ], 403);
        }

        if ($order->status !== 'out_for_delivery' || ! $order->rider) {
            return response()->json([
                'success' => false,
                'message' => 'Order is not out for delivery or rider not assigned',
            ], 404);
        }

        $rider = $order->rider;

        return response()->json([
            'success' => true,
            'data' => [
                'rider_id' => $rider->id,
                'latitude' => (float) $rider->current_latitude,
                'longitude' => (float) $rider->current_longitude,
                'updated_at' => $rider->last_location_update,
            ],
        ]);
    }
}
