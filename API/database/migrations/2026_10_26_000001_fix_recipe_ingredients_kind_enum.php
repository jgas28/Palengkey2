<?php

use App\Models\RecipeIngredient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Some databases (prod, and staging copied from it) still have the old
     * kind ENUM('main','spice_condiment') even though 2026_09_27_000006 is
     * recorded as run, so saving a recipe with kind 'meat' fails with
     * "Data truncated for column 'kind'". Widen, backfill, then narrow to
     * the set the app uses. Safe to run where the column is already correct.
     */
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE recipe_ingredients MODIFY kind ENUM('main','spice_condiment','meat','vegetable','condiment','spice') NOT NULL DEFAULT 'meat'",
        );
        DB::statement("UPDATE recipe_ingredients SET kind = 'meat' WHERE kind = 'main'");
        DB::statement("UPDATE recipe_ingredients SET kind = 'spice' WHERE kind = 'spice_condiment'");
        DB::statement(
            "ALTER TABLE recipe_ingredients MODIFY kind ENUM('meat','vegetable','condiment','spice') NOT NULL DEFAULT 'meat'",
        );

        // Kind now always follows the item's category; bring existing lines in line.
        foreach (['recipe_ingredients', 'paluto_dish_ingredients'] as $table) {
            DB::table($table)
                ->join('items', 'items.id', '=', "{$table}.item_id")
                ->leftJoin('categories', 'categories.id', '=', 'items.category_id')
                ->select("{$table}.id", 'categories.name as category')
                ->get()
                ->each(fn ($row) => DB::table($table)->where('id', $row->id)->update([
                    'kind' => RecipeIngredient::kindForCategory($row->category),
                ]));
        }
    }

    public function down(): void
    {
        // Not reversible: the old values never matched what the app writes.
    }
};
