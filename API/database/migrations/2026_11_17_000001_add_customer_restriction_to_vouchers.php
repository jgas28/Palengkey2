<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vouchers for specific customers: when for_specific_customers is on, only
     * the customers listed in voucher_customers can see or use the voucher.
     * The flag (not "has any rows") decides it, so emptying the list can never
     * open a private voucher to everyone.
     */
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (! Schema::hasColumn('vouchers', 'for_specific_customers')) {
                $table->boolean('for_specific_customers')->default(false)->after('is_public');
            }
        });

        if (! Schema::hasTable('voucher_customers')) {
            Schema::create('voucher_customers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['voucher_id', 'customer_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_customers');

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn('for_specific_customers');
        });
    }
};
