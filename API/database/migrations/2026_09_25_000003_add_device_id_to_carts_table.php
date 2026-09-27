<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL — the project doesn't have doctrine/dbal installed, which
        // Schema::table()->change() requires for modifying an existing column.
        DB::statement('ALTER TABLE carts MODIFY customer_id BIGINT UNSIGNED NULL');

        Schema::table('carts', function (Blueprint $table) {
            // Guest cart, keyed by the frontend's stable per-install device id
            // (src/utils/deviceId.ts) instead of a customer — merged into the
            // customer's own cart on login/register (CustomerAuthController).
            $table->string('device_id')->nullable()->after('customer_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('device_id');
        });

        DB::statement('ALTER TABLE carts MODIFY customer_id BIGINT UNSIGNED NOT NULL');
    }
};
