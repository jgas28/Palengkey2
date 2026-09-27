<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable — tags which ingredient lines belong to a cooked/ingredients-only
        // recipe bundle; NULL for plain ingredient purchases, unchanged from today.
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('order_recipe_bundle_id')->nullable()->after('order_id')
                ->constrained('order_recipe_bundles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('order_recipe_bundle_id');
        });
    }
};
