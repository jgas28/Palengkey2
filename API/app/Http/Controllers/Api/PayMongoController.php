<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashlessPayment;
use App\Models\Order;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayMongoController extends Controller
{
    public function __construct(protected PayMongoService $payMongo) {}

    public function webhook(Request $request)
    {
        $signature = $request->header('Paymongo-Signature') ?? $request->header('X-PayMongo-Signature');
        $payload = $request->getContent();

        if (! $this->payMongo->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $data = $request->json('data');
        $eventType = $data['attributes']['type'] ?? null;
        $eventResource = $data['attributes']['data'] ?? [];
        $eventAttributes = $eventResource['attributes'] ?? [];

        if (in_array($eventType, ['payment.paid', 'payment.failed'], true)) {
            $paymentIntentId = $eventAttributes['payment_intent_id'] ?? null;
            $status = $eventType === 'payment.paid' ? 'paid' : 'failed';

            if ($paymentIntentId) {
                $cashless = CashlessPayment::where('reference', $paymentIntentId)->first();

                if ($cashless) {
                    $cashless->update([
                        'status' => $status,
                        'raw_response' => array_merge((array) ($cashless->raw_response ?? []), ['webhook' => $data]),
                    ]);

                    $order = $cashless->order;
                    if ($order && ! $this->isCancelledOrder($order)) {
                        $order->forceFill([
                            'payment_status' => $status,
                            'payment_reference' => $paymentIntentId,
                        ])->save();

                        if ($status === 'paid') {
                            $this->markOrderReceived($order);
                        }
                    }
                }
            }
        } elseif ($eventType === 'qrph.expired') {
            $paymentIntentId = $eventAttributes['payment_intent_id']
                ?? $eventAttributes['payment_intent']['id']
                ?? null;

            if ($paymentIntentId) {
                $cashless = CashlessPayment::where('reference', $paymentIntentId)->first();

                if ($cashless) {
                    $cashless->update([
                        'status' => 'expired',
                        'raw_response' => array_merge((array) ($cashless->raw_response ?? []), ['webhook' => $data]),
                    ]);

                    $cashless->order?->forceFill(['payment_status' => 'expired'])->save();
                }
            }
        } elseif ($eventType === 'payment_intent.succeeded') {
            $paymentIntentId = $eventResource['id'] ?? null;

            if (! $paymentIntentId) {
                return response()->json(['success' => true]);
            }

            $cashless = CashlessPayment::where('reference', $paymentIntentId)->first();

            if ($cashless) {
                $cashless->update([
                    'status' => 'paid',
                    'raw_response' => array_merge((array) ($cashless->raw_response ?? []), ['webhook' => $data]),
                ]);

                $order = $cashless->order;
                if ($order && ! $this->isCancelledOrder($order)) {
                    $order->forceFill([
                        'payment_status' => 'paid',
                        'payment_reference' => $paymentIntentId,
                    ])->save();

                    $this->markOrderReceived($order);
                }

                return response()->json(['success' => true]);
            }
        } else {
            Log::info('Unhandled PayMongo webhook event', ['type' => $eventType]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Only the pending_payment -> order_received transition belongs here. Payment
     * webhooks can be retried by PayMongo, and by the time a retry lands an admin
     * may have already moved the order past "received" — forceFill'ing it back
     * whenever status just isn't RECEIVED yet would stomp that progress.
     */
    private function markOrderReceived(Order $order): void
    {
        if ($order->status !== 'pending_payment') {
            return;
        }

        $order->forceFill(['status' => 'order_received'])->save();
    }

    private function isCancelledOrder(Order $order): bool
    {
        return $order->status === 'cancelled';
    }
}
