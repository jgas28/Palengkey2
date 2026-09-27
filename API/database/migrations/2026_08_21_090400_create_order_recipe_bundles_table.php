<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per cooked (or ingredients-only) recipe inside an order. Recipe/stall
        // fields are snapshotted at order time (mirrors OrderItem.item_name/price_at_purchase)
        // so editing/retiring a recipe or stall later never rewrites order history.
        Schema::create('order_recipe_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_recipe_bundles');
    }
};
