<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bulk discount as a flat peso amount off per kilo (e.g. meat ₱5/kg less),
        // replacing the old % vendor-cost adjustment. Null on a category = use the
        // global default setting; null on an item = use its category's amount.
        Schema::table('categories', function (Blueprint $table) {
            $table->decimal('bulk_discount_per_kg', 10, 2)->nullable()->after('bulk_min_kg');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->decimal('bulk_discount_per_kg', 10, 2)->nullable()->after('bulk_min_kg');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('bulk_discount_per_kg');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('bulk_discount_per_kg');
        });
    }
};
