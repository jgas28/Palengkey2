<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    private const QRPH_PAYMENT_TIMEOUT_MINUTES = 15;

    private const BPI_PAYMENT_TIMEOUT_MINUTES = 15;

    /** Card/GCash/Maya/UnionBank hosted checkout — more time for OTPs and 3-D Secure. */
    private const HOSTED_CHECKOUT_TIMEOUT_MINUTES = 30;

    public function myOrders(Request $request)
    {
        $customer = $request->user();

        $this->cancelExpiredPendingCashlessOrders($customer->id);

        $orders = Order::where('customer_id', $customer->id)
            ->with('items.item.unit')
            ->latest()
            ->paginate(10);

        $orders->getCollection()->transform(function (Order $order) {
            $order->setAttribute('received_at', $order->created_at);

            return $order;
        });

        return $orders;
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeOwnership($request, $order);

        $order->load(['items.item.unit', 'cashlessPayment', 'rider', 'recipeBundles.stall', 'market:id,name,latitude,longitude']);
        $order->setAttribute('received_at', $order->created_at);
        // Photo per line for the order page (the item may since have been removed from the catalog).
        $order->items->each(fn ($line) => $line->setAttribute('image', $line->item?->image_full_url));
        $order->setAttribute(
            'delivery_photo',
            $order->delivery_photo && config('filesystems.disks.s3.key')
                ? Storage::disk('s3')->url($order->delivery_photo)
                : null
        );

        return response()->json($order);
    }

    public function stats(Request $request)
    {
        $customer = $request->user();
        $delivered = ['delivered', 'completed'];
        $cancelled = ['cancelled'];

        $base = Order::where('customer_id', $customer->id);

        return response()->json([
            'total_orders' => (clone $base)->count(),
            'delivered_count' => (clone $base)->whereIn('status', $delivered)->count(),
            'cancelled_count' => (clone $base)->whereIn('status', $cancelled)->count(),
            'pending_count' => (clone $base)->whereNotIn('status', [...$delivered, ...$cancelled])->count(),
            'total_spent' => (float) (clone $base)->whereIn('status', $delivered)->sum('total_amount'),
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        $this->authorizeOwnership($request, $order);

        return DB::transaction(function () use ($order) {
            $order = Order::lockForUpdate()->find($order->id);

            if (! $order->isCustomerCancellable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order can only be cancelled while it is still received or waiting for payment.',
                ], 422);
            }

            $wasPendingCashless = $order->status === 'pending_payment';

            $updates = [
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $wasPendingCashless
                    ? 'Cashless payment cancelled by customer.'
                    : $order->cancellation_reason,
            ];

            if ($wasPendingCashless) {
                $updates['payment_status'] = 'expired';
            }

            $order->update($updates);

            if ($wasPendingCashless) {
                $order->cashlessPayment()->update(['status' => 'expired']);
            }

            \App\Models\Notification::create([
                'customer_id' => $order->customer_id,
                'title' => 'Order Cancelled',
                'message' => "You have successfully cancelled order #{$order->order_number}.",
                'type' => 'order_cancelled',
                'data' => ['order_id' => $order->id],
                'is_read' => false,
            ]);

            $order->refresh();
            $order->setAttribute('received_at', $order->created_at);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => $order,
            ]);
        });
    }

    public function downloadInvoice(Request $request, Order $order)
    {
        $this->authorizeOwnership($request, $order);

        $binary = InvoiceService::getPdf($order);

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="Palengkey_Invoice_'.$order->order_number.'.pdf"',
        ]);
    }

    private function authorizeOwnership(Request $request, Order $order): void
    {
        abort_if($order->customer_id !== $request->user()->id, 403, 'Unauthorized.');
    }

    /** Auto-cancel this customer's own stale pending_payment orders whenever they check their order list. */
    private function cancelExpiredPendingCashlessOrders(int $customerId): void
    {
        $staleOrders = Order::where('customer_id', $customerId)
            ->where('status', 'pending_payment')
            ->whereIn('payment_method', ['qr_ph', 'qr ph', 'qr-ph', ...Order::CASHLESS_METHODS])
            ->where('payment_status', 'pending')
            ->get();

        foreach ($staleOrders as $order) {
            $method = strtolower((string) $order->payment_method);
            $timeoutMinutes = match (true) {
                $method === 'bpi' => self::BPI_PAYMENT_TIMEOUT_MINUTES,
                array_key_exists($method, Order::CHECKOUT_SESSION_METHODS) => self::HOSTED_CHECKOUT_TIMEOUT_MINUTES,
                default => self::QRPH_PAYMENT_TIMEOUT_MINUTES,
            };

            if ($order->created_at->gt(now()->subMinutes($timeoutMinutes))) {
                continue;
            }

            DB::transaction(function () use ($order, $timeoutMinutes) {
                $lockedOrder = Order::lockForUpdate()->find($order->id);

                if (
                    ! $lockedOrder
                    || $lockedOrder->status !== 'pending_payment'
                    || $lockedOrder->payment_status !== 'pending'
                    || $lockedOrder->created_at->gt(now()->subMinutes($timeoutMinutes))
                ) {
                    return;
                }

                $label = Order::paymentMethodLabel(
                    str_starts_with(strtolower((string) $lockedOrder->payment_method), 'qr') ? 'qrph' : $lockedOrder->payment_method
                );

                $lockedOrder->update([
                    'status' => 'cancelled',
                    'payment_status' => 'expired',
                    'cancelled_at' => now(),
                    'cancellation_reason' => "{$label} payment expired.",
                ]);

                $lockedOrder->cashlessPayment()->update(['status' => 'expired']);
            });
        }
    }
}
