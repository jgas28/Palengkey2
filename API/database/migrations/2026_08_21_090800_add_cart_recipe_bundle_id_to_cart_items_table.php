<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable — mirrors order_items.order_recipe_bundle_id on the cart side.
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('cart_recipe_bundle_id')->nullable()->after('cart_id')
                ->constrained('cart_recipe_bundles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cart_recipe_bundle_id');
        });
    }
};
