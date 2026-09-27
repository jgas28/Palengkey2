<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SupportMessage;
use App\Models\SupportThread;
use Illuminate\Http\Request;

class CustomerSupportController extends Controller
{
    public function index(Request $request)
    {
        $customer = $request->user();

        $threads = SupportThread::with(['order', 'market', 'latestMessage'])
            ->where('customer_id', $customer->id)
            ->latest('updated_at')
            ->get();

        $orders = $customer->orders()
            ->with(['market', 'supportThread.latestMessage'])
            ->latest()
            ->take(20)
            ->get();

        return response()->json(['threads' => $threads, 'orders' => $orders]);
    }

    public function openForOrder(Request $request, string $orderNumber)
    {
        $customer = $request->user();

        $order = Order::with('market')
            ->where('order_number', $orderNumber)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $thread = SupportThread::firstOrCreate(
            ['customer_id' => $customer->id, 'order_id' => $order->id],
            [
                'market_id' => $order->market_id,
                'subject' => 'Support for order #'.$order->order_number,
                'status' => 'open',
                'last_message_at' => now(),
            ],
        );

        return response()->json(['thread' => $thread->load(['order', 'market'])]);
    }

    public function messages(Request $request, SupportThread $thread)
    {
        $this->authorizeOwnership($request, $thread);

        $thread->messages()->where('sender_type', 'admin')->whereNull('read_at')->update(['read_at' => now()]);

        $messages = $thread->messages()
            ->with(['customer', 'user'])
            ->oldest()
            ->get()
            ->map(fn (SupportMessage $message) => $this->formatMessage($message));

        return response()->json(['messages' => $messages]);
    }

    public function storeMessage(Request $request, SupportThread $thread)
    {
        $this->authorizeOwnership($request, $thread);

        $data = $request->validate(['body' => 'required|string|max:2000']);

        $message = $thread->messages()->create([
            'customer_id' => $request->user()->id,
            'sender_type' => 'customer',
            'body' => trim($data['body']),
        ]);

        $thread->update(['status' => 'open', 'last_message_at' => $message->created_at]);

        return response()->json(['message' => $this->formatMessage($message->load('customer'))]);
    }

    private function authorizeOwnership(Request $request, SupportThread $thread): void
    {
        abort_if($thread->customer_id !== $request->user()->id, 403, 'Unauthorized');
    }

    private function formatMessage(SupportMessage $message): array
    {
        $senderName = $message->sender_type === 'admin'
            ? ($message->user?->name ?? 'Market Admin')
            : ($message->customer?->fname ?? 'You');

        return [
            'id' => $message->id,
            'sender_type' => $message->sender_type,
            'sender_name' => $senderName,
            'body' => $message->body,
            'created_at' => $message->created_at?->format('M d, h:i A'),
        ];
    }
}
