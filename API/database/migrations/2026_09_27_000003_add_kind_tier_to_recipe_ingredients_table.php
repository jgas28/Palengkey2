<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recipe_ingredients', function (Blueprint $table) {
            // kind: what type of ingredient this is. tier: whether it's essential
            // to the dish (primary) or a supporting item (sub) that a stall may
            // already provide as part of its cooking service.
            $table->enum('kind', ['main', 'condiment', 'spice'])->default('main')->after('item_id');
            $table->enum('tier', ['primary', 'sub'])->default('primary')->after('kind');
        });
    }

    public function down(): void
    {
        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->dropColumn(['kind', 'tier']);
        });
    }
};
