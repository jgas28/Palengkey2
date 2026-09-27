<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            // How this dish is scaled/sold — the recipe's own ingredient list is
            // written for base_quantity units of pricing_unit (e.g. 1.00 kg or 4 servings).
            $table->enum('pricing_unit', ['kg', 'serving']);
            $table->decimal('base_quantity', 10, 3);
            // Soft-deactivate, never hard-delete — referenced by orders.
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
