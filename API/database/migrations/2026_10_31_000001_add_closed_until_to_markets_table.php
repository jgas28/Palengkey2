<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Close market": while now < closed_until every item in the market is Order
     * Later only and deliveries start on the reopen date. closed_until is the
     * reopen date at the opening time, so the market reopens by itself.
     *
     * Same name as the old admin project's migration, and the column checks make
     * it a no-op if that one already ran on a shared database.
     */
    public function up(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            if (! Schema::hasColumn('markets', 'closed_until')) {
                $table->dateTime('closed_until')->nullable()->after('cutoff_timezone');
            }
            if (! Schema::hasColumn('markets', 'closed_reason')) {
                $table->string('closed_reason', 160)->nullable()->after('closed_until');
            }
        });
    }

    public function down(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->dropColumn(['closed_until', 'closed_reason']);
        });
    }
};
