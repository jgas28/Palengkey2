<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketPriceSnapshot;
use App\Models\Recipe;
use App\Support\PriceDisplay;
use Illuminate\Http\Request;

class RecipeApiController extends Controller
{
    public function index(Request $request)
    {
        $recipeTypeId = $request->query('recipe_type_id');
        $search = $request->query('search');

        $query = Recipe::query()
            ->where('status', 1)
            ->with(['recipeType:id,name']);

        if ($recipeTypeId) {
            $query->where('recipe_type_id', $recipeTypeId);
        }

        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%");
        }

        $recipes = $query->orderBy('name')->paginate(20);

        $recipes->getCollection()->transform(fn (Recipe $recipe) => [
            'id' => $recipe->id,
            'name' => $recipe->name,
            'description' => $recipe->description,
            'image' => $recipe->image_full_url,
            'pricing_unit' => $recipe->pricing_unit,
            'base_quantity' => $recipe->base_quantity,
            'recipe_type' => $recipe->recipeType?->name,
        ]);

        return response()->json($recipes);
    }

    /**
     * Recipes are market-independent; passing market_id prices each ingredient at
     * that market (the same price the cart will charge), with unit_price null for
     * ingredients the market has no price for.
     */
    public function show(Request $request, Recipe $recipe)
    {
        if (! $recipe->status) {
            return response()->json(['message' => 'Recipe unavailable'], 404);
        }

        $marketId = $request->query('market_id');

        $recipe->load(['recipeType', 'ingredients.item.unit', 'ingredients.unit']);

        $snapshots = $marketId
            ? MarketPriceSnapshot::where('market_id', $marketId)
                ->whereIn('item_id', $recipe->ingredients->pluck('item_id')->unique())
                ->get()
                ->keyBy('item_id')
            : collect();

        return response()->json([
            'id' => $recipe->id,
            'name' => $recipe->name,
            'description' => $recipe->description,
            'steps' => $recipe->steps ?? [],
            'tips' => $recipe->tips,
            'image' => $recipe->image_full_url,
            'recipe_type' => $recipe->recipeType?->name,
            'pricing_unit' => $recipe->pricing_unit,
            'base_quantity' => $recipe->base_quantity,
            'market_id' => $marketId ? (int) $marketId : null,
            'ingredients' => $recipe->ingredients->map(function ($ingredient) use ($snapshots) {
                $snapshot = $snapshots[$ingredient->item_id] ?? null;

                return [
                    'id' => $ingredient->id,
                    'item_id' => $ingredient->item_id,
                    'name' => $ingredient->item?->name,
                    'image' => $ingredient->item?->image_full_url,
                    'kind' => $ingredient->kind,
                    'quantity' => $ingredient->quantity,
                    'unit' => $ingredient->unit?->short_name ?? $ingredient->item?->unit?->short_name,
                    'is_optional' => $ingredient->is_optional,
                    'note' => $ingredient->note,
                    'unit_price' => $snapshot
                        ? number_format(PriceDisplay::markedUp($snapshot->price), 2, '.', '')
                        : null,
                ];
            }),
        ]);
    }
}
