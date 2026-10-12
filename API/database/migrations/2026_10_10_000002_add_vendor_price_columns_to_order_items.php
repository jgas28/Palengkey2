<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Market staff haggle with vendors, so what we actually pay can be below the
        // listed price. vendor_list_price is the vendor price per unit at checkout
        // (before markup); vendor_price/vendor_note are what staff record after buying.
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('vendor_list_price', 10, 2)->nullable()->after('regular_price');
            $table->decimal('vendor_price', 10, 2)->nullable()->after('vendor_list_price');
            $table->text('vendor_note')->nullable()->after('vendor_price');
            $table->unsignedBigInteger('vendor_price_by')->nullable()->after('vendor_note');
            $table->timestamp('vendor_price_at')->nullable()->after('vendor_price_by');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['vendor_list_price', 'vendor_price', 'vendor_note', 'vendor_price_by', 'vendor_price_at']);
        });
    }
};
