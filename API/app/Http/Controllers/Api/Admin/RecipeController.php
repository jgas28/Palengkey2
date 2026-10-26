<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $recipeTypeId = $request->query('recipe_type_id');
        $status = $request->query('status');

        $query = Recipe::query()
            ->with(['recipeType', 'ingredients.item', 'ingredients.unit'])
            ->when($search !== '', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"))
            ->when($recipeTypeId, fn (Builder $q) => $q->where('recipe_type_id', $recipeTypeId))
            ->when($status !== null, fn (Builder $q) => $q->where('status', (int) $status))
            ->orderBy('name');

        $recipes = $query->paginate(20);
        $recipes->getCollection()->transform(fn (Recipe $recipe) => $this->formatRecipe($recipe));

        return response()->json($recipes);
    }

    public function show(Recipe $recipe)
    {
        return response()->json(
            $this->formatRecipe($recipe->load(['recipeType', 'ingredients.item', 'ingredients.unit'])),
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'steps' => 'nullable|array',
            'steps.*' => 'string|max:500',
            'tips' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:4096',
            'recipe_type_id' => 'nullable|exists:recipe_types,id,status,1',
            'pricing_unit' => 'required|in:kg,serving',
            'base_quantity' => 'required|numeric|min:0.001',
            'status' => 'boolean',
            'ingredients' => 'nullable|array',
            'ingredients.*.item_id' => 'required_with:ingredients|exists:items,id,status,1',
            'ingredients.*.kind' => 'nullable|in:meat,vegetable,condiment,spice',
            'ingredients.*.quantity' => 'required_with:ingredients|numeric|min:0.001',
            'ingredients.*.unit_id' => 'required_with:ingredients|exists:units,id,status,1',
            'ingredients.*.is_optional' => 'boolean',
            'ingredients.*.note' => 'nullable|string|max:255',
            'ingredients.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $disk = $this->disk();
        $path = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->storeAs(
                'recipes',
                Str::slug($data['name']).'-'.uniqid().'.'.$request->file('image')->extension(),
                $disk,
            );
        }

        try {
            $recipe = DB::transaction(function () use ($data, $path) {
                $recipe = Recipe::create([
                    'name' => trim($data['name']),
                    'description' => $data['description'] ?? null,
                    'steps' => $data['steps'] ?? null,
                    'tips' => $data['tips'] ?? null,
                    'image' => $path,
                    'recipe_type_id' => $data['recipe_type_id'] ?? null,
                    'pricing_unit' => $data['pricing_unit'],
                    'base_quantity' => $data['base_quantity'],
                    'status' => $data['status'] ?? true,
                ]);

                if (! empty($data['ingredients'])) {
                    $this->syncIngredients($recipe, $data['ingredients']);
                }

                AuditLogger::log('recipe_created', $recipe, $recipe->id, null, $recipe->toArray());

                return $recipe;
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk($disk)->delete($path);
            }
            throw $e;
        }

        return response()->json(
            $this->formatRecipe($recipe->fresh(['recipeType', 'ingredients.item', 'ingredients.unit'])),
            201,
        );
    }

    public function update(Request $request, Recipe $recipe)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'steps' => 'nullable|array',
            'steps.*' => 'string|max:500',
            'tips' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:4096',
            'recipe_type_id' => 'nullable|exists:recipe_types,id,status,1',
            'pricing_unit' => 'sometimes|required|in:kg,serving',
            'base_quantity' => 'sometimes|required|numeric|min:0.001',
            'status' => 'boolean',
            'ingredients' => 'sometimes|array|min:1',
            'ingredients.*.item_id' => 'required_with:ingredients|exists:items,id,status,1',
            'ingredients.*.kind' => 'nullable|in:meat,vegetable,condiment,spice',
            'ingredients.*.quantity' => 'required_with:ingredients|numeric|min:0.001',
            'ingredients.*.unit_id' => 'required_with:ingredients|exists:units,id,status,1',
            'ingredients.*.is_optional' => 'boolean',
            'ingredients.*.note' => 'nullable|string|max:255',
            'ingredients.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $old = $recipe->toArray();
        $disk = $this->disk();
        $newPath = null;

        if ($request->hasFile('image')) {
            $newPath = $request->file('image')->storeAs(
                'recipes',
                Str::slug($data['name'] ?? $recipe->name).'-'.uniqid().'.'.$request->file('image')->extension(),
                $disk,
            );
            $data['image'] = $newPath;
        }

        try {
            DB::transaction(function () use ($recipe, $data) {
                $recipe->update(collect($data)->except('ingredients')->all());

                if (array_key_exists('ingredients', $data)) {
                    $this->syncIngredients($recipe, $data['ingredients']);
                }
            });
        } catch (\Throwable $e) {
            if ($newPath) {
                Storage::disk($disk)->delete($newPath);
            }
            throw $e;
        }

        if ($newPath && $old['image']) {
            Storage::disk($disk)->delete($old['image']);
        }

        AuditLogger::log('recipe_updated', $recipe, $recipe->id, $old, $recipe->fresh()->toArray());

        return response()->json(
            $this->formatRecipe($recipe->fresh(['recipeType', 'ingredients.item', 'ingredients.unit'])),
        );
    }

    /** Deactivates rather than hard-deletes — recipes are referenced by order history. */
    public function destroy(Recipe $recipe)
    {
        $old = $recipe->toArray();
        $recipe->update(['status' => false]);

        AuditLogger::log('recipe_deactivated', $recipe, $recipe->id, $old, null);

        return response()->json(['message' => 'Recipe deactivated.']);
    }

    public function restore(Recipe $recipe)
    {
        $recipe->update(['status' => true]);
        AuditLogger::log('recipe_restored', $recipe, $recipe->id, null, $recipe->toArray());

        return response()->json(['message' => 'Recipe restored.']);
    }

    /** Bulk-replaces a recipe's ingredient list — the CMS's "Save ingredients" action. */
    public function updateIngredients(Request $request, Recipe $recipe)
    {
        $data = $request->validate([
            'ingredients' => 'required|array|min:1',
            'ingredients.*.item_id' => 'required|exists:items,id,status,1',
            'ingredients.*.kind' => 'nullable|in:meat,vegetable,condiment,spice',
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit_id' => 'required|exists:units,id,status,1',
            'ingredients.*.is_optional' => 'boolean',
            'ingredients.*.note' => 'nullable|string|max:255',
            'ingredients.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $old = $recipe->ingredients->toArray();

        DB::transaction(function () use ($recipe, $data) {
            $this->syncIngredients($recipe, $data['ingredients']);
        });

        $recipe->load('ingredients.item', 'ingredients.unit');

        AuditLogger::log('recipe_ingredients_updated', $recipe, $recipe->id, $old, $recipe->ingredients->toArray());

        return response()->json($recipe->ingredients->map(fn (RecipeIngredient $ingredient) => [
            'id' => $ingredient->id,
            'item_id' => $ingredient->item_id,
            'item_name' => $ingredient->item?->name,
            'kind' => $ingredient->kind,
            'quantity' => $ingredient->quantity,
            'unit_id' => $ingredient->unit_id,
            'unit_name' => $ingredient->unit?->short_name,
            'is_optional' => $ingredient->is_optional,
            'note' => $ingredient->note,
            'sort_order' => $ingredient->sort_order,
        ]));
    }

    /**
     * unit_id is always derived from the ingredient's item, never trusted from the
     * request — price is computed as quantity × the item's live per-unit price, so a
     * unit that diverges from the item's actual selling unit (e.g. "g" for a per-kg
     * item) would silently miscompute the ingredient cost with no conversion applied.
     */
    private function syncIngredients(Recipe $recipe, array $ingredients): void
    {
        $items = Item::with('category')->whereIn('id', collect($ingredients)->pluck('item_id'))->get()->keyBy('id');

        RecipeIngredient::where('recipe_id', $recipe->id)->delete();

        foreach ($ingredients as $index => $ingredient) {
            RecipeIngredient::create([
                'recipe_id' => $recipe->id,
                'item_id' => $ingredient['item_id'],
                'kind' => RecipeIngredient::kindForCategory($items[$ingredient['item_id']]->category?->name),
                'quantity' => $ingredient['quantity'],
                'unit_id' => $items[$ingredient['item_id']]->unit_id,
                'is_optional' => $ingredient['is_optional'] ?? false,
                'note' => $ingredient['note'] ?? null,
                'sort_order' => $ingredient['sort_order'] ?? $index,
            ]);
        }
    }

    private function formatRecipe(Recipe $recipe): array
    {
        return [
            'id' => $recipe->id,
            'name' => $recipe->name,
            'description' => $recipe->description,
            'steps' => $recipe->steps ?? [],
            'tips' => $recipe->tips,
            'image_url' => $recipe->image_full_url,
            'status' => $recipe->status,
            'recipe_type_id' => $recipe->recipe_type_id,
            'recipe_type' => $recipe->recipeType?->name,
            'pricing_unit' => $recipe->pricing_unit,
            'base_quantity' => $recipe->base_quantity,
            'ingredients' => $recipe->ingredients->map(fn (RecipeIngredient $ingredient) => [
                'id' => $ingredient->id,
                'item_id' => $ingredient->item_id,
                'item_name' => $ingredient->item?->name,
                'kind' => $ingredient->kind,
                'quantity' => $ingredient->quantity,
                'unit_id' => $ingredient->unit_id,
                'unit_name' => $ingredient->unit?->short_name,
                'is_optional' => $ingredient->is_optional,
                'note' => $ingredient->note,
                'sort_order' => $ingredient->sort_order,
            ]),
            'created_at' => $recipe->created_at,
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
