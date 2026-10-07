<?php

namespace App\Services;

use App\Models\CashlessPayment;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private ?string $secretKey;

    private ?string $publicKey;

    private string $apiUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = env('PAYMONGO_SECRET_KEY');
        $this->publicKey = env('PAYMONGO_PUBLIC_KEY');
    }

    public function createPaymentIntent($orderId, $amount, $description = '', $metadata = [], array $allowedMethods = ['card'])
    {
        try {
            $attributes = [
                'amount' => (int) round($amount * 100),
                'currency' => 'PHP',
                'payment_method_allowed' => $allowedMethods,
                'capture_type' => 'automatic',
                'description' => $description,
                'metadata' => $this->normalizeMetadata(array_merge(['order_id' => $orderId], $metadata)),
            ];

            if (empty($attributes['metadata'])) {
                unset($attributes['metadata']);
            }

            if (in_array('card', $allowedMethods, true)) {
                $attributes['payment_method_options'] = [
                    'card' => ['request_three_d_secure' => 'any'],
                ];
            }

            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl.'/payment_intents', ['data' => ['attributes' => $attributes]]);

            if ($response->failed()) {
                Log::error('PayMongo payment intent error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function createQrphPaymentMethod(Order $order, ?int $expirySeconds = null)
    {
        try {
            $attributes = ['type' => 'qrph'];

            if ($expirySeconds !== null) {
                $attributes['expiry_seconds'] = $expirySeconds;
            }

            $response = Http::withBasicAuth($this->publicKey, '')
                ->post($this->apiUrl.'/payment_methods', ['data' => ['attributes' => $attributes]]);

            if ($response->failed()) {
                Log::error('PayMongo QR Ph payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo QR Ph payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function attachQrphPaymentMethod(string $paymentIntentId, string $paymentMethodId, string $clientKey)
    {
        try {
            $response = Http::withBasicAuth($this->publicKey, '')
                ->post($this->apiUrl."/payment_intents/{$paymentIntentId}/attach", [
                    'data' => ['attributes' => ['payment_method' => $paymentMethodId, 'client_key' => $clientKey]],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo QR Ph attach payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo QR Ph attach payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function createPaymentMethod($cardNumber, $month, $year, $cvc, $cardName)
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl.'/payment_methods', [
                    'data' => [
                        'attributes' => [
                            'type' => 'card',
                            'details' => [
                                'card_number' => $cardNumber,
                                'exp_month' => (int) $month,
                                'exp_year' => (int) $year,
                                'cvc' => $cvc,
                            ],
                            'billing' => ['name' => $cardName],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo create payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo create payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function attachPaymentMethod($paymentIntentId, $paymentMethodId, ?string $returnUrl = null)
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl."/payment_intents/{$paymentIntentId}/attach", [
                    'data' => [
                        'attributes' => [
                            'payment_method' => $paymentMethodId,
                            'return_url' => $returnUrl ?? route('customer.payment.confirm'),
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo attach payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo attach payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function createQrphPayment(Order $order): ?CashlessPayment
    {
        $order->loadMissing('customer');

        $intent = $this->createPaymentIntent(
            $order->id,
            $order->total_amount,
            "Order {$order->order_number} - Palengkey",
            ['order_number' => $order->order_number, 'customer_email' => $order->customer->email ?? null],
            ['qrph']
        );

        if (! $intent) {
            return null;
        }

        $paymentMethod = $this->createQrphPaymentMethod($order);

        if (! $paymentMethod) {
            return null;
        }

        $clientKey = $intent['attributes']['client_key'] ?? null;

        if (! $clientKey) {
            Log::error('PayMongo QR Ph payment intent missing client_key', ['payment_intent_id' => $intent['id'] ?? null]);

            return null;
        }

        $attachedIntent = $this->attachQrphPaymentMethod($intent['id'], $paymentMethod['id'], $clientKey);

        if (! $attachedIntent) {
            return null;
        }

        $attributes = $attachedIntent['attributes'] ?? [];
        $code = $attributes['next_action']['code'] ?? [];
        $status = $this->normalizePaymentStatus($attributes['status'] ?? null);

        $rawResponse = $this->redactQrImage([
            'payment_intent' => $intent,
            'payment_method' => $paymentMethod,
            'attached_intent' => $attachedIntent,
        ]);

        $cashless = CashlessPayment::updateOrCreate(
            ['order_id' => $order->id, 'provider' => 'paymongo', 'method' => 'qrph'],
            [
                'reference' => $intent['id'],
                'qr_url' => $code['image_url'] ?? null,
                'amount' => $order->total_amount,
                'currency' => 'PHP',
                'status' => $status,
                'raw_response' => $rawResponse,
            ]
        );

        $order->forceFill([
            'payment_method' => 'qrph',
            'payment_status' => $status,
            'payment_reference' => $intent['id'],
            'cashless_payment_id' => $cashless->id,
        ])->save();

        return $cashless;
    }

    public function syncCashlessPaymentStatus(CashlessPayment $cashless): ?CashlessPayment
    {
        if (! $cashless->reference) {
            return $cashless;
        }

        $intent = $this->getPaymentIntent($cashless->reference);

        if (! $intent) {
            return null;
        }

        $status = $this->normalizePaymentStatus($intent['attributes']['status'] ?? null);

        $cashless->update([
            'status' => $status,
            'raw_response' => array_merge((array) ($cashless->raw_response ?? []), [
                'latest_intent' => $this->redactQrImage($intent),
            ]),
        ]);

        if ($cashless->order) {
            $cashless->order->forceFill(['payment_status' => $status])->save();
        }

        return $cashless->fresh();
    }

    public function createBpiPaymentMethod(Order $order): ?array
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl.'/payment_methods', [
                    'data' => [
                        'attributes' => [
                            'type' => 'dob',
                            'details' => ['bank_code' => 'bpi'],
                            'billing' => [
                                'name' => $order->contact_name ?? ($order->customer->name ?? ''),
                                'email' => $order->customer->email ?? '',
                                'phone' => $order->contact_phone ?? '',
                            ],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo BPI payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo BPI payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function attachBpiPaymentMethod(string $paymentIntentId, string $paymentMethodId, string $returnUrl): ?array
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl."/payment_intents/{$paymentIntentId}/attach", [
                    'data' => ['attributes' => ['payment_method' => $paymentMethodId, 'return_url' => $returnUrl]],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo BPI attach payment method error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo BPI attach payment method exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function createBpiPayment(Order $order, ?string $returnUrl = null): ?CashlessPayment
    {
        $order->loadMissing('customer');

        $intent = $this->createPaymentIntent(
            $order->id,
            $order->total_amount,
            "Order {$order->order_number} - Palengkey",
            ['order_number' => $order->order_number, 'customer_email' => $order->customer->email ?? null],
            ['dob']
        );

        if (! $intent) {
            return null;
        }

        $paymentMethod = $this->createBpiPaymentMethod($order);

        if (! $paymentMethod) {
            return null;
        }

        // Callers without an active web session (e.g. the mobile app, which
        // only carries a Bearer token) must pass their own return URL.
        $returnUrl = $returnUrl ?? route('api.bpi.return', $order);

        $attachedIntent = $this->attachBpiPaymentMethod($intent['id'], $paymentMethod['id'], $returnUrl);

        if (! $attachedIntent) {
            return null;
        }

        $attributes = $attachedIntent['attributes'] ?? [];
        $redirectUrl = $attributes['next_action']['redirect']['url'] ?? null;
        $status = $this->normalizePaymentStatus($attributes['status'] ?? null);

        $cashless = CashlessPayment::updateOrCreate(
            ['order_id' => $order->id, 'provider' => 'paymongo', 'method' => 'bpi'],
            [
                'reference' => $intent['id'],
                'redirect_url' => $redirectUrl,
                'amount' => $order->total_amount,
                'currency' => 'PHP',
                'status' => $status,
                'raw_response' => [
                    'payment_intent' => $intent,
                    'payment_method' => $paymentMethod,
                    'attached_intent' => $attachedIntent,
                ],
            ]
        );

        $order->forceFill([
            'payment_method' => 'bpi',
            'payment_status' => $status,
            'payment_reference' => $intent['id'],
            'cashless_payment_id' => $cashless->id,
        ])->save();

        return $cashless;
    }

    /**
     * Card, GCash, Maya and UnionBank go through a PayMongo-hosted checkout page:
     * card details and wallet/bank logins never touch our servers. The session's
     * payment intent id is stored as the reference, so the webhook and the
     * return-page sync handle these exactly like BPI/QR Ph.
     */
    public function createCheckoutSessionPayment(
        Order $order,
        string $method,
        string $successUrl,
        string $cancelUrl,
    ): ?CashlessPayment {
        $payMongoType = Order::CHECKOUT_SESSION_METHODS[$method] ?? null;

        if (! $payMongoType) {
            return null;
        }

        $order->loadMissing('customer');

        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->post($this->apiUrl.'/checkout_sessions', [
                    'data' => [
                        'attributes' => [
                            'line_items' => [[
                                'name' => "Palengkey order {$order->order_number}",
                                'amount' => (int) round($order->total_amount * 100),
                                'currency' => 'PHP',
                                'quantity' => 1,
                            ]],
                            'payment_method_types' => [$payMongoType],
                            'description' => "Order {$order->order_number} - Palengkey",
                            'reference_number' => $order->order_number,
                            'success_url' => $successUrl,
                            'cancel_url' => $cancelUrl,
                            'send_email_receipt' => false,
                            'show_description' => true,
                            'show_line_items' => false,
                            'billing' => array_filter([
                                'name' => $order->contact_name,
                                'email' => $order->customer->email ?? null,
                                'phone' => $order->contact_phone,
                            ]),
                            'metadata' => $this->normalizeMetadata([
                                'order_id' => $order->id,
                                'order_number' => $order->order_number,
                            ]),
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('PayMongo checkout session error:', (array) $response->json());

                return null;
            }

            $session = $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo checkout session exception:', ['message' => $e->getMessage()]);

            return null;
        }

        $attributes = $session['attributes'] ?? [];
        $paymentIntentId = $attributes['payment_intent']['id'] ?? null;
        $checkoutUrl = $attributes['checkout_url'] ?? null;

        if (! $paymentIntentId || ! $checkoutUrl) {
            Log::error('PayMongo checkout session missing payment intent or URL', ['session_id' => $session['id'] ?? null]);

            return null;
        }

        $cashless = CashlessPayment::updateOrCreate(
            ['order_id' => $order->id, 'provider' => 'paymongo', 'method' => $method],
            [
                'reference' => $paymentIntentId,
                'redirect_url' => $checkoutUrl,
                'amount' => $order->total_amount,
                'currency' => 'PHP',
                'status' => 'pending',
                'raw_response' => ['checkout_session' => $session],
            ]
        );

        $order->forceFill([
            'payment_method' => $method,
            'payment_status' => 'pending',
            'payment_reference' => $paymentIntentId,
            'cashless_payment_id' => $cashless->id,
        ])->save();

        return $cashless;
    }

    public function getPaymentIntent($paymentIntentId)
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->get($this->apiUrl."/payment_intents/{$paymentIntentId}");

            if ($response->failed()) {
                Log::error('PayMongo get payment intent error:', (array) $response->json());

                return null;
            }

            return $response->json()['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('PayMongo get payment intent exception:', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function verifyWebhookSignature($payload, $signature): bool
    {
        if (! $signature) {
            return false;
        }

        $secret = env('PAYMONGO_WEBHOOK_SECRET', $this->secretKey);
        $computed = hash_hmac('sha256', $payload, $secret);

        return hash_equals($computed, $signature) || str_contains($signature, $computed);
    }

    public function getPublicKey()
    {
        return $this->publicKey;
    }

    public function normalizePaymentStatus(?string $status): string
    {
        return match ($status) {
            'succeeded', 'paid' => 'paid',
            'failed', 'cancelled' => 'failed',
            'expired' => 'expired',
            default => 'pending',
        };
    }

    private function normalizeMetadata(array $metadata): array
    {
        $normalized = [];

        foreach ($metadata as $key => $value) {
            if ($value === null || is_array($value) || is_object($value)) {
                continue;
            }

            $normalized[$key] = (string) $value;
        }

        return $normalized;
    }

    private function redactQrImage(array $payload): array
    {
        $redacted = $payload;
        $this->replaceQrImageUrls($redacted);

        return $redacted;
    }

    private function replaceQrImageUrls(array &$payload): void
    {
        foreach ($payload as $key => &$value) {
            if ($key === 'image_url' && is_string($value) && str_starts_with($value, 'data:image/')) {
                $value = '[stored in cashless_payments.qr_url]';

                continue;
            }

            if (is_array($value)) {
                $this->replaceQrImageUrls($value);
            }
        }
    }
}
