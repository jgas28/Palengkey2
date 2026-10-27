<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\OrderFeedback;
use App\Models\Setting;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    /** Landing-page hero stat chips (Admin > Settings > Landing Page). Blank pairs are skipped. */
    public function heroStats()
    {
        $stats = collect(range(1, 4))
            ->map(fn (int $i) => [
                'value' => trim((string) Setting::get("hero_stat_{$i}_value", '')),
                'label' => trim((string) Setting::get("hero_stat_{$i}_label", '')),
            ])
            ->filter(fn (array $stat) => $stat['value'] !== '' && $stat['label'] !== '')
            ->values();

        return response()->json($stats);
    }

    public function deliveryAreas()
    {
        $grouped = Market::whereIn('status', [1, 2])
            ->whereNotNull('location')
            ->get(['location', 'status'])
            ->groupBy('location')
            ->map(fn ($markets) => $markets->contains('status', 1) ? 'available' : 'coming_soon');

        return response()->json([
            'available' => $grouped->filter(fn ($state) => $state === 'available')->keys()->sort()->values(),
            'coming_soon' => $grouped->filter(fn ($state) => $state === 'coming_soon')->keys()->sort()->values(),
        ]);
    }

    public function featuredReviews()
    {
        $reviews = OrderFeedback::fiveStar()
            ->with(['customer', 'market'])
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (OrderFeedback $review) => [
                'public_customer_name' => $review->public_customer_name,
                'comment' => $review->comment,
                'rating' => $review->rating,
                'market_name' => $review->market?->name,
            ]);

        return response()->json($reviews);
    }

    /**
     * Written 4- and 5-star reviews for the public reviews page, newest first,
     * optionally one star value only. `breakdown` counts them per star.
     */
    public function reviews(Request $request)
    {
        $rating = $request->integer('rating');

        $written = fn () => OrderFeedback::query()
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->where('rating', '>=', 4);

        $reviews = $written()
            ->with(['customer:id,fname', 'market:id,name'])
            ->when(in_array($rating, [4, 5], true), fn ($q) => $q->where('rating', $rating))
            ->latest()
            ->paginate(12)
            ->through(fn (OrderFeedback $review) => [
                'id' => $review->id,
                'public_customer_name' => $review->public_customer_name,
                'comment' => $review->comment,
                'rating' => $review->rating,
                'market_name' => $review->market?->name,
                'created_at' => $review->created_at?->toDateString(),
            ]);

        $breakdown = $written()
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        return response()->json([
            ...$reviews->toArray(),
            'breakdown' => collect([5, 4])->mapWithKeys(fn ($star) => [$star => (int) ($breakdown[$star] ?? 0)]),
        ]);
    }

    /** Live totals for the landing page's review badge (every submitted rating). */
    public function reviewStats()
    {
        $stats = OrderFeedback::query()
            ->selectRaw('COUNT(*) as total, AVG(rating) as average')
            ->first();

        return response()->json([
            'total_reviews' => (int) ($stats->total ?? 0),
            'average_rating' => $stats->average !== null ? round((float) $stats->average, 1) : null,
        ]);
    }
}
