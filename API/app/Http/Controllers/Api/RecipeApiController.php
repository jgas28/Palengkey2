<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PalutoStallRecipe;
use App\Models\Recipe;
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

    public function show(Recipe $recipe, Request $request)
    {
        if (! $recipe->status) {
            return response()->json(['message' => 'Recipe unavailable'], 404);
        }

        $marketId = $request->query('market_id');

        $recipe->load(['recipeType', 'ingredients.item.unit']);

        $stalls = [];

        if ($marketId) {
            $stalls = PalutoStallRecipe::where('recipe_id', $recipe->id)
                ->where('status', true)
                ->whereHas('stall', function ($q) use ($marketId) {
                    $q->where('market_id', $marketId)
                        ->where('status', true)
                        ->where('is_accepting_orders', true);
                })
                ->with('stall')
                ->get()
                ->map(fn (PalutoStallRecipe $sr) => [
                    'id' => $sr->paluto_stall_id,
                    'name' => $sr->stall->name,
                    'market_id' => $sr->stall->market_id,
                    'description' => $sr->stall->description,
                    'image' => $sr->stall->image_full_url,
                    'contact_phone' => $sr->stall->contact_phone,
                    'is_accepting_orders' => $sr->stall->is_accepting_orders,
                    'prep_time_minutes' => $sr->stall->prep_time_minutes,
                    'rate' => $sr->rate,
                    'minimum_fee' => $sr->minimum_fee,
                    // Which of this recipe's ingredients this stall already
                    // includes (spices/condiments/garnish, etc.) — those are
                    // skipped when this stall cooks the order, never charged twice.
                    'provided_ingredient_ids' => $sr->provided_ingredient_ids ?? [],
                ])
                ->values();
        }

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
            'ingredients' => $recipe->ingredients->map(fn ($ingredient) => [
                'id' => $ingredient->id,
                'item_id' => $ingredient->item_id,
                'name' => $ingredient->item?->name,
                'image' => $ingredient->item?->image_full_url,
                'kind' => $ingredient->kind,
                'quantity' => $ingredient->quantity,
                'unit' => $ingredient->unit?->short_name ?? $ingredient->item?->unit?->short_name,
                'is_optional' => $ingredient->is_optional,
                'note' => $ingredient->note,
            ]),
            // Only populated when market_id is passed — stalls in that market that
            // currently cook this recipe, with their live rate/minimum fee.
            'stalls' => $stalls,
        ]);
    }
}
