<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Recipes previously borrowed the shop's item `categories` table for
            // filtering, which doesn't fit cooking-style tags (Soup, Fried, etc.).
            // `category_id` is left in place (unused going forward) rather than
            // dropped, to avoid a destructive migration.
            $table->foreignId('recipe_type_id')->nullable()->after('category_id')
                ->constrained('recipe_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recipe_type_id');
        });
    }
};
