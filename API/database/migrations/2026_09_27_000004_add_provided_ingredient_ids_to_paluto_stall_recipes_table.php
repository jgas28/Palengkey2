<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paluto_stall_recipes', function (Blueprint $table) {
            // recipe_ingredients.id values this stall already provides (spices,
            // condiments, garnish, etc.) for this recipe — those are skipped when
            // adding a "Cook for Me" order from this stall to the cart.
            $table->json('provided_ingredient_ids')->nullable()->after('minimum_fee');
        });
    }

    public function down(): void
    {
        Schema::table('paluto_stall_recipes', function (Blueprint $table) {
            $table->dropColumn('provided_ingredient_ids');
        });
    }
};
