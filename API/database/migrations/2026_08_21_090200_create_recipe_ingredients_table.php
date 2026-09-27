<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            // Wholly owned by the recipe — cascade delete.
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            // Quantity of item required per the recipe's base_quantity.
            $table->decimal('quantity', 10, 3);
            $table->foreignId('unit_id')->constrained('units');
            $table->boolean('is_optional')->default(false);
            $table->string('note')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
    }
};
