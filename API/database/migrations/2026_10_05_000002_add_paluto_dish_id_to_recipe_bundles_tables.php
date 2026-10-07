<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cook-for-Me bundles now point at the stall's own dish; recipe_id stays for
        // Buy Raw (recipe catalog) bundles. recipe_name keeps the snapshotted name of
        // whichever one the bundle came from.
        Schema::table('cart_recipe_bundles', function (Blueprint $table) {
            $table->foreignId('paluto_dish_id')->nullable()->after('recipe_id')
                ->constrained('paluto_dishes')->nullOnDelete();
        });

        Schema::table('order_recipe_bundles', function (Blueprint $table) {
            $table->foreignId('paluto_dish_id')->nullable()->after('recipe_id')
                ->constrained('paluto_dishes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_recipe_bundles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paluto_dish_id');
        });

        Schema::table('cart_recipe_bundles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paluto_dish_id');
        });
    }
};
