<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderFeedback;
use Illuminate\Http\Request;

class CustomerFeedbackController extends Controller
{
    public function show(Request $request)
    {
        $data = $request->validate(['order_id' => 'required|exists:orders,id']);

        $order = Order::where('id', $data['order_id'])
            ->where('customer_id', $request->user()->id)
            ->firstOrFail();

        $feedback = OrderFeedback::where('order_id', $order->id)->first();

        return response()->json(['success' => true, 'data' => $feedback]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'is_anonymous' => 'nullable|boolean',
        ]);

        $customer = $request->user();

        $order = Order::where('id', $data['order_id'])
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        if (! in_array($order->status, ['delivered', 'completed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback is available after the order is delivered.',
            ], 422);
        }

        $feedback = OrderFeedback::updateOrCreate(
            ['order_id' => $order->id],
            [
                'customer_id' => $customer->id,
                'market_id' => $order->market_id,
                'rating' => $data['rating'],
                'comment' => trim((string) ($data['comment'] ?? '')) ?: null,
                'is_anonymous' => $request->boolean('is_anonymous'),
            ],
        );

        return response()->json(['success' => true, 'message' => 'Feedback saved.', 'data' => $feedback]);
    }
}
