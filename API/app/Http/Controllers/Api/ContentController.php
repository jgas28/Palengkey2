<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\OrderFeedback;
use App\Models\Setting;

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
}
