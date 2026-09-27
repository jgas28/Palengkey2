<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryApiController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->where('status', 1)
            ->withCount(['items' => fn ($query) => $query->where('status', 1)])
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
