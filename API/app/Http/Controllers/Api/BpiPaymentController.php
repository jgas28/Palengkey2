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

        // The customer can land here more than once; only pending_payment advances.
        $payMongo->markOrderReceivedIfPaid($order);

        return response()->view('customer.bpi-app-return', [
            'status' => $order->payment_status,
            'orderNumber' => $order->order_number,
            'methodLabel' => Order::paymentMethodLabel($order->payment_method),
            'cancelled' => $request->boolean('cancelled') && $order->payment_status !== 'paid',
        ]);
    }
}
