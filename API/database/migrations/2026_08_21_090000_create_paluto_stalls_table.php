<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paluto_stalls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('market_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('contact_phone')->nullable();
            // Soft-deactivate, never hard-delete — referenced by orders.
            $table->boolean('status')->default(true);
            $table->boolean('is_accepting_orders')->default(true);
            $table->integer('prep_time_minutes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paluto_stalls');
    }
};
