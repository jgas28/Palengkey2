<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Shared databases (e.g. palengkey_stg) already have this table, created by the
        // original Palengkey app with extra columns and live rows — leave it as is.
        if (Schema::hasTable('deleted_account_cooldowns')) {
            return;
        }

        Schema::create('deleted_account_cooldowns', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('phone')->nullable()->index();
            $table->timestamp('deleted_at');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deleted_account_cooldowns');
    }
};
