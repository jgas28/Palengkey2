<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When each customer was emailed about their personal voucher, so saving the
     * voucher again only emails customers who haven't been told yet.
     */
    public function up(): void
    {
        Schema::table('voucher_customers', function (Blueprint $table) {
            if (! Schema::hasColumn('voucher_customers', 'notified_at')) {
                $table->timestamp('notified_at')->nullable()->after('customer_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('voucher_customers', function (Blueprint $table) {
            $table->dropColumn('notified_at');
        });
    }
};
