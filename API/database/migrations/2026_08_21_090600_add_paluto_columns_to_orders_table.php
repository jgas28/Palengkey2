<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // All new columns nullable/defaulted so the existing standard order flow is untouched.
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['standard', 'paluto'])->default('standard')->after('market_id');
            $table->foreignId('paluto_stall_id')->nullable()->after('order_type')->constrained('paluto_stalls')->nullOnDelete();
            $table->decimal('paluto_cooking_fee', 10, 2)->default(0)->after('service_fee');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paluto_stall_id');
            $table->dropColumn(['order_type', 'paluto_cooking_fee']);
        });
    }
};
