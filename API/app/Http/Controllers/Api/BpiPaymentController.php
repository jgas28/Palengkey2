<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PayMongoService;
use Illuminate\Http\Request;

class BpiPaymentController extends Controller
{
    /**
     * Where PayMongo sends the customer's browser back to after they finish (or
     * cancel) paying on BPI's site or the PayMongo-hosted checkout page (card,
     * GCash, Maya, UnionBank). No auth token is available
     * here — the app only ever holds a Bearer token, not a session cookie — so
     * this just re-syncs the authoritative status from PayMongo and shows a
     * plain confirmation page telling the customer to return to the app.
     */
    public function appReturn(Request $request, Order $order, PayMongoService $payMongo)
    {
        $cashless = $order->cashlessPayment;

        if ($cashless && $cashless->reference) {
            $cashless = $payMongo->syncCashlessPaymentStatus($cashless) ?? $cashless;
            $order->refresh();
        }

        // Only advance pending_payment -> received here. The customer can land on
        // this page more than once (retrying the redirect, browser back/forward),
        // and by then an admin may have already moved the order further along —
        // resetting on every "not RECEIVED yet" status would stomp that progress.
        if ($order->payment_status === 'paid' && $order->status === 'pending_payment') {
            $order->forceFill(['status' => 'order_received'])->save();
        }

        return response()->view('customer.bpi-app-return', [
            'status' => $order->payment_status,
            'orderNumber' => $order->order_number,
            'methodLabel' => Order::paymentMethodLabel($order->payment_method),
            'cancelled' => $request->boolean('cancelled') && $order->payment_status !== 'paid',
        ]);
    }
}
