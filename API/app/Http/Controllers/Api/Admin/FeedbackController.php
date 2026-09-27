<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderFeedback;
use App\Models\User;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filter = $request->query('filter', 'bad');

        $feedback = OrderFeedback::with(['customer', 'market', 'order', 'reviewedBy'])
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('market_id', $user->market_id))
            ->when($filter === 'bad', fn ($query) => $query->badReview())
            ->when($filter === 'five_star', fn ($query) => $query->where('rating', 5))
            ->when($filter === 'unreviewed', fn ($query) => $query->where('status', 'new'))
            ->when($filter === 'reviewed', fn ($query) => $query->where('status', 'reviewed'))
            ->latest()
            ->paginate(20);

        $counts = [
            'bad' => $this->scopedFeedback($user)->badReview()->count(),
            'unreviewed' => $this->scopedFeedback($user)->where('status', 'new')->count(),
            'reviewed' => $this->scopedFeedback($user)->where('status', 'reviewed')->count(),
            'all' => $this->scopedFeedback($user)->count(),
        ];

        return response()->json(['feedback' => $feedback, 'counts' => $counts]);
    }

    public function show(Request $request, OrderFeedback $feedback)
    {
        $this->authorizeFeedback($request, $feedback);
        $feedback->load(['customer', 'market', 'order.items.item', 'reviewedBy']);

        return response()->json($feedback);
    }

    public function markReviewed(Request $request, OrderFeedback $feedback)
    {
        $this->authorizeFeedback($request, $feedback);

        $data = $request->validate(['admin_notes' => 'nullable|string|max:2000']);

        $feedback->update([
            'status' => 'reviewed',
            'admin_notes' => trim((string) ($data['admin_notes'] ?? '')) ?: null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json($feedback->fresh(['customer', 'market', 'order', 'reviewedBy']));
    }

    public function reopen(Request $request, OrderFeedback $feedback)
    {
        $this->authorizeFeedback($request, $feedback);

        $feedback->update(['status' => 'new', 'reviewed_by' => null, 'reviewed_at' => null]);

        return response()->json($feedback->fresh(['customer', 'market', 'order', 'reviewedBy']));
    }

    private function scopedFeedback(User $user)
    {
        return OrderFeedback::query()->when(! $user->isSuperAdmin(), fn ($query) => $query->where('market_id', $user->market_id));
    }

    private function authorizeFeedback(Request $request, OrderFeedback $feedback): void
    {
        $user = $request->user();
        abort_if(! $user->isSuperAdmin() && (int) $feedback->market_id !== (int) $user->market_id, 403);
    }
}
