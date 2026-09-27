<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportThread;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->query('status', 'open');

        $threads = SupportThread::with(['customer', 'market', 'order', 'latestMessage'])
            ->withCount([
                'messages as unread_customer_count' => fn ($query) => $query->where('sender_type', 'customer')->whereNull('read_at'),
            ])
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('market_id', $user->market_id))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest('updated_at')
            ->paginate(20);

        return response()->json($threads);
    }

    public function show(Request $request, SupportThread $thread)
    {
        $this->authorizeAdminThread($request, $thread);

        $thread->load(['customer', 'market', 'order', 'messages.customer', 'messages.user']);
        $thread->messages()->where('sender_type', 'customer')->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json($thread);
    }

    public function storeMessage(Request $request, SupportThread $thread)
    {
        $this->authorizeAdminThread($request, $thread);

        $data = $request->validate(['body' => 'required|string|max:2000']);

        $message = $thread->messages()->create([
            'user_id' => $request->user()->id,
            'sender_type' => 'admin',
            'body' => trim($data['body']),
        ]);

        $thread->update(['status' => 'open', 'last_message_at' => $message->created_at]);

        return response()->json(['message' => $this->formatMessage($message->load('user'))]);
    }

    public function messages(Request $request, SupportThread $thread)
    {
        $this->authorizeAdminThread($request, $thread);

        $afterId = max(0, (int) $request->query('after_id', 0));

        $thread->messages()->where('sender_type', 'customer')->whereNull('read_at')->update(['read_at' => now()]);

        $messagesQuery = $thread->messages()
            ->with(['customer', 'user'])
            ->when($afterId > 0, fn ($query) => $query->where('id', '>', $afterId));

        $rawMessages = $afterId > 0
            ? $messagesQuery->oldest()->limit(50)->get()
            : $messagesQuery->latest('id')->limit(200)->get()->sortBy('id')->values();

        $messages = $rawMessages->map(fn ($message) => $this->formatMessage($message));

        return response()->json([
            'messages' => $messages,
            'latest_message_id' => max($afterId, (int) ($messages->max('id') ?? 0)),
            'unread_count' => $this->unreadCustomerCount($thread),
        ]);
    }

    public function close(Request $request, SupportThread $thread)
    {
        $this->authorizeAdminThread($request, $thread);
        $thread->update(['status' => 'closed']);

        return response()->json($thread->fresh());
    }

    public function reopen(Request $request, SupportThread $thread)
    {
        $this->authorizeAdminThread($request, $thread);
        $thread->update(['status' => 'open']);

        return response()->json($thread->fresh());
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $unreadCount = SupportMessage::query()
            ->where('sender_type', 'customer')
            ->whereNull('read_at')
            ->whereHas('thread', function ($query) use ($user) {
                $query->when(! $user->isSuperAdmin(), fn ($threadQuery) => $threadQuery->where('market_id', $user->market_id));
            })
            ->count();

        return response()->json(['unread_count' => $unreadCount]);
    }

    private function authorizeAdminThread(Request $request, SupportThread $thread): void
    {
        $user = $request->user();
        abort_if(! $user->isSuperAdmin() && (int) $thread->market_id !== (int) $user->market_id, 403);
    }

    private function formatMessage($message): array
    {
        $senderName = $message->sender_type === 'admin'
            ? ($message->user?->name ?? 'Market Admin')
            : ($message->customer?->fname ?? 'Customer');

        return [
            'id' => $message->id,
            'sender_type' => $message->sender_type,
            'sender_name' => $senderName,
            'body' => $message->body,
            'created_at' => $message->created_at?->format('M d, h:i A'),
        ];
    }

    private function unreadCustomerCount(SupportThread $thread): int
    {
        return $thread->messages()->where('sender_type', 'customer')->whereNull('read_at')->count();
    }
}
