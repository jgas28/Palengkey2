<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bulk tier: a single item's total weight at/above this unlocks the wholesale
        // price and the delivery subsidy. Null on a category = not eligible; null on
        // an item = use its category's value.
        Schema::table('categories', function (Blueprint $table) {
            $table->decimal('bulk_min_kg', 8, 3)->nullable()->after('image');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->decimal('bulk_min_kg', 8, 3)->nullable()->after('unit_id');
        });

        // What the bulk tier saved the customer and cost us, kept separate from
        // voucher_discount so subsidy spend vs. product margin can be reported.
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('bulk_discount', 10, 2)->default(0)->after('voucher_id');
            $table->decimal('bulk_delivery_subsidy', 10, 2)->default(0)->after('bulk_discount');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->boolean('is_bulk')->default(false)->after('price_at_purchase');
            // Per-unit price this line would have cost without the bulk tier.
            $table->decimal('regular_price', 10, 2)->nullable()->after('is_bulk');
        });

        // Starting thresholds from the bulk-order proposal; editable in the CMS.
        DB::table('categories')->whereIn('name', ['Poultry And Meats', 'Fishes And Seafoods'])->update(['bulk_min_kg' => 6]);
        DB::table('categories')->whereIn('name', ['Vegetables', 'Fruits'])->update(['bulk_min_kg' => 10]);
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['is_bulk', 'regular_price']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['bulk_discount', 'bulk_delivery_subsidy']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('bulk_min_kg');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('bulk_min_kg');
        });
    }
};
