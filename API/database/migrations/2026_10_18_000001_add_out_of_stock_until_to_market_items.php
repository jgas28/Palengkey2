<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Out of stock" = hidden today, back automatically on this date (Manila).
        Schema::table('market_items', function (Blueprint $table) {
            $table->date('out_of_stock_until')->nullable()->after('is_available');
        });
    }

    public function down(): void
    {
        Schema::table('market_items', function (Blueprint $table) {
            $table->dropColumn('out_of_stock_until');
        });
    }
};
