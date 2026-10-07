<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Turns every existing stall↔recipe fee row into that stall's own dish, with
     * its own copy of the recipe's ingredient list (previously "provided" ingredient
     * ids become is_provided lines), re-points open carts and past orders at the
     * new dish, then drops paluto_stall_recipes.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $stallRecipes = DB::table('paluto_stall_recipes')->orderBy('id')->get();

            foreach ($stallRecipes as $stallRecipe) {
                $recipe = DB::table('recipes')->where('id', $stallRecipe->recipe_id)->first();

                if (! $recipe) {
                    continue;
                }

                $now = now();

                $dishId = DB::table('paluto_dishes')->insertGetId([
                    'paluto_stall_id' => $stallRecipe->paluto_stall_id,
                    'name' => $recipe->name,
                    'description' => $recipe->description,
                    'image' => $recipe->image,
                    'recipe_type_id' => $recipe->recipe_type_id,
                    'pricing_unit' => $recipe->pricing_unit,
                    'base_quantity' => $recipe->base_quantity,
                    'rate' => $stallRecipe->rate,
                    'minimum_fee' => $stallRecipe->minimum_fee,
                    'status' => $stallRecipe->status && $recipe->status,
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $providedIds = collect(json_decode($stallRecipe->provided_ingredient_ids ?? '[]', true) ?: [])
                    ->map(fn ($id) => (int) $id);

                $ingredients = DB::table('recipe_ingredients')
                    ->where('recipe_id', $recipe->id)
                    ->orderBy('sort_order')
                    ->get();

                foreach ($ingredients as $ingredient) {
                    DB::table('paluto_dish_ingredients')->insert([
                        'paluto_dish_id' => $dishId,
                        'item_id' => $ingredient->item_id,
                        'kind' => $ingredient->kind,
                        'quantity' => $ingredient->quantity,
                        'unit_id' => $ingredient->unit_id,
                        'is_optional' => $ingredient->is_optional,
                        'is_provided' => $providedIds->contains((int) $ingredient->id),
                        'note' => $ingredient->note,
                        'sort_order' => $ingredient->sort_order,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                foreach (['cart_recipe_bundles', 'order_recipe_bundles'] as $bundleTable) {
                    DB::table($bundleTable)
                        ->where('paluto_stall_id', $stallRecipe->paluto_stall_id)
                        ->where('recipe_id', $stallRecipe->recipe_id)
                        ->update(['paluto_dish_id' => $dishId]);
                }
            }
        });

        Schema::dropIfExists('paluto_stall_recipes');
    }

    /** Restores the table's shape only — the per-stall dishes can't be folded back into shared recipes. */
    public function down(): void
    {
        Schema::create('paluto_stall_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paluto_stall_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->decimal('rate', 10, 2);
            $table->decimal('minimum_fee', 10, 2)->nullable();
            $table->json('provided_ingredient_ids')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();

            $table->unique(['paluto_stall_id', 'recipe_id']);
        });
    }
};
