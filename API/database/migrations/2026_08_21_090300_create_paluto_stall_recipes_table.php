<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The "stall names their cooking fee" CMS data.
        Schema::create('paluto_stall_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paluto_stall_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            // Pesos per unit of the recipe's pricing_unit (kg or serving).
            $table->decimal('rate', 10, 2);
            $table->decimal('minimum_fee', 10, 2)->nullable();
            // Soft-deactivate — stall can 86 a recipe without deleting the row.
            $table->boolean('status')->default(true);
            $table->timestamps();

            $table->unique(['paluto_stall_id', 'recipe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paluto_stall_recipes');
    }
};
