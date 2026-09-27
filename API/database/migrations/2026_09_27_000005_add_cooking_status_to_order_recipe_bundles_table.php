<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_recipe_bundles', function (Blueprint $table) {
            // Only meaningful when paluto_stall_id is set (a "Cook for Me"
            // bundle) — tracks the stall's kitchen progress, separate from
            // the whole order's delivery-logistics status.
            $table->enum('cooking_status', [
                'pending',
                'preparing',
                'cooking',
                'ready_for_pickup',
                'out_for_delivery',
                'delivered',
            ])->default('pending')->after('cooking_fee');
        });
    }

    public function down(): void
    {
        Schema::table('order_recipe_bundles', function (Blueprint $table) {
            $table->dropColumn('cooking_status');
        });
    }
};
