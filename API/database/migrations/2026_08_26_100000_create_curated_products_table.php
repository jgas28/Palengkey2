<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curated_products', function (Blueprint $table) {
            $table->id();
            // 'highlighted_products' | 'best_deals' — which landing-page section this belongs to.
            $table->string('section');
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['section', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curated_products');
    }
};
