<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PalutoStall;
use App\Models\PalutoStallRecipe;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * The "stall names their cooking fee" CMS screen: every active recipe, with
 * whether this stall currently offers it and at what rate/minimum fee.
 */
class PalutoStallRecipeController extends Controller
{
    /** Every active recipe, left-joined with this stall's existing fee row (if any). */
    public function index(PalutoStall $stall)
    {
        $recipes = Recipe::where('status', true)->with('ingredients.item')->orderBy('name')->get();
        $stallRecipes = $stall->stallRecipes()->get()->keyBy('recipe_id');

        return response()->json($recipes->map(function (Recipe $recipe) use ($stallRecipes) {
            $stallRecipe = $stallRecipes->get($recipe->id);

            return [
                'recipe_id' => $recipe->id,
                'recipe_name' => $recipe->name,
                'pricing_unit' => $recipe->pricing_unit,
                'offered' => $stallRecipe !== null,
                'rate' => $stallRecipe?->rate,
                'minimum_fee' => $stallRecipe?->minimum_fee,
                'status' => $stallRecipe?->status ?? true,
                // So the CMS can render "which ingredients does this stall already
                // provide" as a checklist once a recipe is marked offered.
                'ingredients' => $recipe->ingredients->map(fn ($ingredient) => [
                    'id' => $ingredient->id,
                    'item_name' => $ingredient->item?->name,
                    'kind' => $ingredient->kind,
                ]),
                'provided_ingredient_ids' => $stallRecipe?->provided_ingredient_ids ?? [],
            ];
        })->values());
    }

    /**
     * Bulk-saves the fee board: one row per recipe, `offered` true
     * upserts the stall's rate/minimum_fee/status, `offered` false
     * deactivates (never hard-deletes) any existing row for that recipe.
     */
    public function store(Request $request, PalutoStall $stall)
    {
        $data = $request->validate([
            'rows' => 'required|array',
            'rows.*.recipe_id' => 'required|exists:recipes,id',
            'rows.*.offered' => 'required|boolean',
            'rows.*.rate' => 'nullable|numeric|min:0',
            'rows.*.minimum_fee' => 'nullable|numeric|min:0',
            'rows.*.status' => 'boolean',
            'rows.*.provided_ingredient_ids' => 'nullable|array',
            'rows.*.provided_ingredient_ids.*' => 'integer',
        ]);

        DB::transaction(function () use ($stall, $data) {
            foreach ($data['rows'] as $row) {
                if ($row['offered']) {
                    if (! isset($row['rate'])) {
                        abort(422, 'A rate is required for every offered recipe.');
                    }

                    // Only ids that actually belong to this recipe's own ingredient
                    // list are kept — never trust the client's set wholesale.
                    $validIngredientIds = RecipeIngredient::where('recipe_id', $row['recipe_id'])
                        ->pluck('id');
                    $providedIds = collect($row['provided_ingredient_ids'] ?? [])
                        ->intersect($validIngredientIds)
                        ->values()
                        ->all();

                    $stallRecipe = PalutoStallRecipe::updateOrCreate(
                        ['paluto_stall_id' => $stall->id, 'recipe_id' => $row['recipe_id']],
                        [
                            'rate' => $row['rate'],
                            'minimum_fee' => $row['minimum_fee'] ?? null,
                            'status' => $row['status'] ?? true,
                            'provided_ingredient_ids' => $providedIds,
                        ],
                    );

                    AuditLogger::log('paluto_stall_recipe_set', $stallRecipe, $stallRecipe->id, null, $stallRecipe->toArray());

                    continue;
                }

                $stallRecipe = PalutoStallRecipe::where('paluto_stall_id', $stall->id)
                    ->where('recipe_id', $row['recipe_id'])
                    ->first();

                if ($stallRecipe && $stallRecipe->status) {
                    $old = $stallRecipe->toArray();
                    $stallRecipe->update(['status' => false]);

                    AuditLogger::log('paluto_stall_recipe_deactivated', $stallRecipe, $stallRecipe->id, $old, null);
                }
            }
        });

        return $this->index($stall);
    }
}
