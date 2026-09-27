<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // No doctrine/dbal installed — enum column changes need raw SQL.
        // Widen first so both old ('main') and new values are valid while
        // backfilling, then narrow to the final set — MySQL enums reject a
        // write for any value outside whatever list is active at the time.
        DB::statement(
            "ALTER TABLE recipe_ingredients MODIFY kind ENUM('main','condiment','spice','meat','vegetable') NOT NULL DEFAULT 'main'",
        );
        DB::statement("UPDATE recipe_ingredients SET kind = 'meat' WHERE kind = 'main'");
        DB::statement(
            "ALTER TABLE recipe_ingredients MODIFY kind ENUM('meat','vegetable','condiment','spice') NOT NULL DEFAULT 'meat'",
        );

        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->dropColumn('tier');
        });
    }

    public function down(): void
    {
        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->enum('tier', ['primary', 'sub'])->default('primary')->after('kind');
        });

        DB::statement(
            "ALTER TABLE recipe_ingredients MODIFY kind ENUM('main','condiment','spice') NOT NULL DEFAULT 'main'",
        );
    }
};
