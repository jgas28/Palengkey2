<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PWD / Senior Citizen discount: the customer's ID (checked once by an
     * admin) and, on each order, the 20% taken off the VAT-exclusive delivery fee.
     */
    public function up(): void
    {
        if (! Schema::hasTable('discount_ids')) {
            Schema::create('discount_ids', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->string('type', 10); // pwd | senior
                $table->string('id_number', 50);
                $table->string('full_name');
                $table->string('disk', 20);
                $table->string('front_path');
                $table->string('back_path');
                $table->string('selfie_path')->nullable();
                $table->string('status', 20)->default('pending'); // pending | approved | rejected
                $table->text('review_notes')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                $table->index(['customer_id', 'status']);
                $table->index('status');
            });
        }

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'pwd_senior_discount')) {
                $table->decimal('pwd_senior_discount', 10, 2)->default(0)->after('voucher_discount');
            }
            if (! Schema::hasColumn('orders', 'pwd_senior_type')) {
                $table->string('pwd_senior_type', 10)->nullable()->after('pwd_senior_discount');
            }
            if (! Schema::hasColumn('orders', 'discount_id_id')) {
                $table->foreignId('discount_id_id')->nullable()->after('pwd_senior_type')
                    ->constrained('discount_ids')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('discount_id_id');
            $table->dropColumn(['pwd_senior_discount', 'pwd_senior_type']);
        });

        Schema::dropIfExists('discount_ids');
    }
};
