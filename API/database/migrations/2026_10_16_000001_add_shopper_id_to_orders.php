<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The market staff member who shops the order (picks items from the vendors).
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('shopper_id')->nullable()->after('rider_id');
            $table->index('shopper_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['shopper_id']);
            $table->dropColumn('shopper_id');
        });
    }
};
