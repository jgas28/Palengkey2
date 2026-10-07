<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A stall's own menu entry — independent of the Recipes catalog, since two
        // stalls cooking "the same dish" still use different ingredients, quantities
        // and fees. Belongs to one stall, so it is implicitly per market too.
        Schema::create('paluto_dishes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paluto_stall_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->foreignId('recipe_type_id')->nullable()->constrained('recipe_types')->nullOnDelete();
            // The dish's ingredient list is written for base_quantity units of pricing_unit.
            $table->enum('pricing_unit', ['kg', 'serving']);
            $table->decimal('base_quantity', 10, 3);
            // Cooking fee — pesos per unit of pricing_unit, floored at minimum_fee.
            $table->decimal('rate', 10, 2);
            $table->decimal('minimum_fee', 10, 2)->nullable();
            // Soft-deactivate, never hard-delete — referenced by orders.
            $table->boolean('status')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // The dish's BOM. No prices here — ingredient prices always come from the
        // stall's market (market_price_snapshots) at add-to-cart/checkout time.
        Schema::create('paluto_dish_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paluto_dish_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->enum('kind', ['meat', 'vegetable', 'condiment', 'spice'])->default('meat');
            // Quantity of item required per the dish's base_quantity.
            $table->decimal('quantity', 10, 3);
            $table->foreignId('unit_id')->constrained('units');
            $table->boolean('is_optional')->default(false);
            // The stall supplies this itself (spices, condiments, etc.) — never
            // bought from the market or charged to the customer.
            $table->boolean('is_provided')->default(false);
            $table->string('note')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paluto_dish_ingredients');
        Schema::dropIfExists('paluto_dishes');
    }
};
