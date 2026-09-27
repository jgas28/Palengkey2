<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Same shape as order_recipe_bundles but for the cart (pre-purchase) — lets a
        // recipe's ingredients + fee preview sit in the cart as one group before checkout.
        // No timestamps, mirroring cart_items (Cart rows are short-lived working state).
        Schema::create('cart_recipe_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->nullable()->constrained('recipes')->nullOnDelete();
            $table->string('recipe_name');
            // Nullable — a customer can add a recipe's raw ingredients without a
            // cooking stall ("no stall — ingredients only" option).
            $table->foreignId('paluto_stall_id')->nullable()->constrained('paluto_stalls')->nullOnDelete();
            $table->string('stall_name')->nullable();
            $table->decimal('quantity', 10, 3);
            $table->enum('pricing_unit', ['kg', 'serving']);
            $table->decimal('rate_at_purchase', 10, 2)->nullable();
            $table->decimal('cooking_fee', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_recipe_bundles');
    }
};
