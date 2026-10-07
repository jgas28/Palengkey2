<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\PalutoDish;
use App\Models\PalutoDishIngredient;
use App\Models\PalutoStall;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Database\Seeder;

/**
 * Demo data for Recipes and Paluto — enough variety to exercise the admin
 * (Recipes CMS, Paluto Stalls CMS, stall menus) and customer paths: catalog
 * recipes across categories and both pricing units, stalls across two markets,
 * an inactive recipe (tests the admin status filter and restore action), a stall
 * not accepting orders, a deactivated dish, and the same dish cooked by two
 * stalls with different ingredient lists and fees. Idempotent (keyed on
 * name/stall) so it's safe to re-run.
 *
 * Not wired into DatabaseSeeder::run() — this connects to the shared
 * palengkey_stg staging database, so run it explicitly:
 *   php artisan db:seed --class=PalutoSeeder
 */
class PalutoSeeder extends Seeder
{
    public function run(): void
    {
        $munozMarketId = 6; // Muñoz Market
        $alabangMarketId = 20; // Alabang Public Market

        $this->seedRecipe(
            name: 'Sinigang na Bangus',
            description: 'Classic Filipino sour tamarind fish stew, cooked fresh with market-bought bangus and vegetables.',
            categoryId: 2, // Fishes And Seafoods
            pricingUnit: 'kg',
            baseQuantity: 1.0,
            ingredients: [
                ['item' => 'Bangus', 'quantity' => 1.000, 'note' => 'Sliced into steaks'],
                ['item' => 'Kangkong', 'quantity' => 0.250],
                ['item' => 'Sitaw', 'quantity' => 0.150],
                ['item' => 'Tomato', 'quantity' => 0.200],
                ['item' => 'Onion Red', 'quantity' => 0.100, 'is_optional' => true],
            ],
        );

        $this->seedRecipe(
            name: 'Sizzling Sisig',
            description: 'Chopped pork sizzling plate, cooked to order with onions and a squeeze of calamansi.',
            categoryId: 1, // Poultry And Meats
            pricingUnit: 'serving',
            baseQuantity: 2,
            ingredients: [
                ['item' => 'Ground Pork', 'quantity' => 0.500],
                ['item' => 'Onion Red', 'quantity' => 0.100],
            ],
        );

        $this->seedRecipe(
            name: 'Beef Caldereta',
            description: 'Rich beef stew simmered with liver spread, carrots, and cabbage.',
            categoryId: 1, // Poultry And Meats
            pricingUnit: 'kg',
            baseQuantity: 1.0,
            ingredients: [
                ['item' => 'Beef Cuts', 'quantity' => 1.000],
                ['item' => 'Carrots', 'quantity' => 0.200],
                ['item' => 'Cabbage', 'quantity' => 0.150, 'is_optional' => true],
            ],
        );

        $this->seedRecipe(
            name: 'Grilled Bangus Belly',
            description: 'Marinated bangus belly grilled to order, served with a squeeze of citrus.',
            categoryId: 2, // Fishes And Seafoods
            pricingUnit: 'serving',
            baseQuantity: 1,
            ingredients: [
                ['item' => 'Bangus', 'quantity' => 0.400],
                ['item' => 'Lemon', 'quantity' => 0.050, 'is_optional' => true],
            ],
        );

        // Seeded inactive on purpose — exercises the admin status filter and restore action.
        $this->seedRecipe(
            name: 'Chicken Tinola',
            description: 'Ginger chicken soup with green papaya and chili leaves.',
            categoryId: 1, // Poultry And Meats
            pricingUnit: 'kg',
            baseQuantity: 1.0,
            ingredients: [
                ['item' => 'Chicken Breast', 'quantity' => 1.000],
            ],
            status: false,
        );

        $alingNenas = $this->seedStall(
            marketId: $munozMarketId,
            name: "Aling Nena's Paluto",
            description: 'Cooks whatever you buy fresh at the market — sinigang, sizzling, and more.',
            contactPhone: '09171234567',
            prepTimeMinutes: 30,
        );

        // A second stall at the same market — lets the customer-side stall picker
        // show more than one option for the same recipe.
        $nanayRosas = $this->seedStall(
            marketId: $munozMarketId,
            name: "Nanay Rosa's Kitchen",
            description: 'Home-style cooking, ready in 20 minutes.',
            contactPhone: '09179876543',
            prepTimeMinutes: 20,
            // Seeded not accepting orders — exercises that toggle in the admin CMS.
            isAcceptingOrders: false,
        );

        $mangKikos = $this->seedStall(
            marketId: $alabangMarketId,
            name: "Mang Kiko's Grill",
            description: 'Grilled and stewed dishes cooked fresh at Alabang Public Market.',
            contactPhone: '09171112233',
            prepTimeMinutes: 25,
        );

        $this->seedDish($alingNenas, 'Sinigang na Bangus', 'kg', 1.0, rate: 60.00, minimumFee: 100.00, ingredients: [
            ['item' => 'Bangus', 'quantity' => 1.000, 'kind' => 'meat', 'note' => 'Sliced into steaks'],
            ['item' => 'Kangkong', 'quantity' => 0.250, 'kind' => 'vegetable'],
            ['item' => 'Sitaw', 'quantity' => 0.150, 'kind' => 'vegetable'],
            ['item' => 'Tomato', 'quantity' => 0.200, 'kind' => 'vegetable'],
            ['item' => 'Onion Red', 'quantity' => 0.100, 'kind' => 'spice', 'is_provided' => true],
        ]);
        $this->seedDish($alingNenas, 'Sizzling Sisig', 'serving', 2, rate: 40.00, minimumFee: 80.00, ingredients: [
            ['item' => 'Ground Pork', 'quantity' => 0.500, 'kind' => 'meat'],
            ['item' => 'Onion Red', 'quantity' => 0.100, 'kind' => 'spice', 'is_provided' => true],
        ]);

        // Same dish as Aling Nena's, but this stall's own version — more fish per
        // kg, no sitaw, and it buys its own onions.
        $this->seedDish($nanayRosas, 'Sinigang na Bangus', 'kg', 1.0, rate: 55.00, minimumFee: 90.00, ingredients: [
            ['item' => 'Bangus', 'quantity' => 1.200, 'kind' => 'meat'],
            ['item' => 'Kangkong', 'quantity' => 0.300, 'kind' => 'vegetable'],
            ['item' => 'Tomato', 'quantity' => 0.250, 'kind' => 'vegetable'],
            ['item' => 'Onion Red', 'quantity' => 0.100, 'kind' => 'spice'],
        ]);
        // Deactivated — exercises the inactive state on the stall menu.
        $this->seedDish($nanayRosas, 'Sizzling Sisig', 'serving', 2, rate: 35.00, minimumFee: 70.00, status: false, ingredients: [
            ['item' => 'Ground Pork', 'quantity' => 0.450, 'kind' => 'meat'],
        ]);

        $this->seedDish($mangKikos, 'Beef Caldereta', 'kg', 1.0, rate: 70.00, minimumFee: 120.00, ingredients: [
            ['item' => 'Beef Cuts', 'quantity' => 1.000, 'kind' => 'meat'],
            ['item' => 'Carrots', 'quantity' => 0.200, 'kind' => 'vegetable'],
            ['item' => 'Cabbage', 'quantity' => 0.150, 'kind' => 'vegetable', 'is_optional' => true],
        ]);
        $this->seedDish($mangKikos, 'Grilled Bangus Belly', 'serving', 1, rate: 45.00, minimumFee: 60.00, ingredients: [
            ['item' => 'Bangus', 'quantity' => 0.400, 'kind' => 'meat'],
            ['item' => 'Lemon', 'quantity' => 0.050, 'kind' => 'condiment', 'is_provided' => true],
        ]);
    }

    /**
     * @param  array<int, array{item: string, quantity: float, note?: string, is_optional?: bool}>  $ingredients
     */
    private function seedRecipe(
        string $name,
        string $description,
        int $categoryId,
        string $pricingUnit,
        float $baseQuantity,
        array $ingredients,
        bool $status = true,
    ): Recipe {
        $recipe = Recipe::firstOrCreate(
            ['name' => $name],
            [
                'description' => $description,
                'category_id' => $categoryId,
                'pricing_unit' => $pricingUnit,
                'base_quantity' => $baseQuantity,
                'status' => $status,
            ],
        );

        if ($recipe->ingredients()->exists()) {
            return $recipe;
        }

        foreach ($ingredients as $index => $ingredient) {
            $item = Item::where('name', $ingredient['item'])->first();

            if (! $item) {
                continue;
            }

            RecipeIngredient::create([
                'recipe_id' => $recipe->id,
                'item_id' => $item->id,
                'quantity' => $ingredient['quantity'],
                'unit_id' => $item->unit_id,
                'is_optional' => $ingredient['is_optional'] ?? false,
                'note' => $ingredient['note'] ?? null,
                'sort_order' => $index,
            ]);
        }

        return $recipe;
    }

    private function seedStall(
        int $marketId,
        string $name,
        string $description,
        string $contactPhone,
        int $prepTimeMinutes,
        bool $isAcceptingOrders = true,
    ): PalutoStall {
        return PalutoStall::firstOrCreate(
            ['market_id' => $marketId, 'name' => $name],
            [
                'description' => $description,
                'contact_phone' => $contactPhone,
                'status' => true,
                'is_accepting_orders' => $isAcceptingOrders,
                'prep_time_minutes' => $prepTimeMinutes,
            ],
        );
    }

    /**
     * @param  array<int, array{item: string, quantity: float, kind: string, note?: string, is_optional?: bool, is_provided?: bool}>  $ingredients
     */
    private function seedDish(
        PalutoStall $stall,
        string $name,
        string $pricingUnit,
        float $baseQuantity,
        float $rate,
        float $minimumFee,
        array $ingredients,
        bool $status = true,
    ): void {
        $dish = PalutoDish::firstOrCreate(
            ['paluto_stall_id' => $stall->id, 'name' => $name],
            [
                'pricing_unit' => $pricingUnit,
                'base_quantity' => $baseQuantity,
                'rate' => $rate,
                'minimum_fee' => $minimumFee,
                'status' => $status,
            ],
        );

        if ($dish->ingredients()->exists()) {
            return;
        }

        foreach ($ingredients as $index => $ingredient) {
            $item = Item::where('name', $ingredient['item'])->first();

            if (! $item) {
                continue;
            }

            PalutoDishIngredient::create([
                'paluto_dish_id' => $dish->id,
                'item_id' => $item->id,
                'kind' => $ingredient['kind'],
                'quantity' => $ingredient['quantity'],
                'unit_id' => $item->unit_id,
                'is_optional' => $ingredient['is_optional'] ?? false,
                'is_provided' => $ingredient['is_provided'] ?? false,
                'note' => $ingredient['note'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }
}
