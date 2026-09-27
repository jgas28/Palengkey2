<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Order;

/** Notifies the customer (in-app row + best-effort push) when an admin moves an order forward. */
class OrderNotifier
{
    private const MESSAGES = [
        'order_confirmed' => [
            'title' => 'Order Confirmed',
            'message' => 'Your order #%s has been confirmed by the market.',
            'icon' => 'check-circle',
        ],
        'preparing_items' => [
            'title' => 'Order Being Prepared',
            'message' => 'Your order #%s is being prepared by the market.',
            'icon' => 'package',
        ],
        'out_for_delivery' => [
            'title' => 'Out for Delivery',
            'message' => 'Your order #%s is out for delivery.',
            'icon' => 'truck',
        ],
        'delivered' => [
            'title' => 'Order Delivered',
            'message' => 'Your order #%s has been delivered. Thank you!',
            'icon' => 'check-circle',
        ],
    ];

    public static function notifyStatusChange(Order $order, string $newStatus): void
    {
        $template = self::MESSAGES[$newStatus] ?? null;

        if (! $template || ! $order->customer_id) {
            return;
        }

        self::send($order, $newStatus, $template['title'], sprintf($template['message'], $order->order_number), $template['icon']);
    }

    public static function notifyCancelled(Order $order, string $reason): void
    {
        if (! $order->customer_id) {
            return;
        }

        self::send(
            $order,
            'cancelled',
            'Order Cancelled',
            "Your order #{$order->order_number} has been cancelled. Reason: {$reason}",
            'x',
        );
    }

    private static function send(Order $order, string $status, string $title, string $message, string $icon): void
    {
        Notification::firstOrCreate([
            'customer_id' => $order->customer_id,
            'rider_id' => null,
            'user_id' => null,
            'type' => 'order_update',
            'order_id' => $order->id,
            'order_status' => $status,
        ], [
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'is_read' => false,
        ]);

        if ($order->customer) {
            CustomerPushNotifier::send($order->customer, $title, $message, ['url' => '/orders/'.$order->id]);
        }
    }
}
