<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $marketId = $request->query('market_id');

        // With a market: count only what the shop lists there (same rule as /items).
        $categories = Category::query()
            ->where('status', 1)
            ->withCount(['items' => function ($query) use ($marketId) {
                $query->where('status', 1)->when($marketId, fn ($q) => $q->where(function ($listed) use ($marketId) {
                    $listed->whereIn('items.id', fn ($s) => $s->select('item_id')->from('market_price_snapshots')->where('market_id', $marketId))
                        ->orWhereIn('items.id', fn ($s) => $s->select('item_id')->from('market_items')->where('market_id', $marketId));
                }));
            }])
            ->orderBy('name')
            ->get(['id', 'name', 'image'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'image_url' => $category->image_url,
                'items_count' => $category->items_count,
            ]);

        return response()->json(['data' => $categories]);
    }
}
