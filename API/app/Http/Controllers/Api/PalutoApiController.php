<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketPriceSnapshot;
use App\Models\PalutoDish;
use App\Models\PalutoDishIngredient;
use App\Models\PalutoStall;
use App\Support\PriceDisplay;
use Illuminate\Http\Request;

/** Customer-facing Paluto: pick a stall in your market, then order from its menu. */
class PalutoApiController extends Controller
{
    /** Active stalls in a market that have at least one active dish. */
    public function stalls(Request $request)
    {
        $data = $request->validate([
            'market_id' => 'required|exists:markets,id',
        ]);

        $stalls = PalutoStall::where('market_id', $data['market_id'])
            ->where('status', true)
            ->whereHas('dishes', fn ($q) => $q->where('status', true))
            ->withCount(['dishes' => fn ($q) => $q->where('status', true)])
            ->orderByDesc('is_accepting_orders')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $stalls->map(fn (PalutoStall $stall) => $this->formatStall($stall) + [
                'dishes_count' => $stall->dishes_count,
            ])->values(),
        ]);
    }

    /** One stall and its menu, with each ingredient priced live at the stall's market. */
    public function stall(PalutoStall $stall)
    {
        if (! $stall->status) {
            return response()->json(['message' => 'Stall unavailable'], 404);
        }

        $dishes = $stall->dishes()
            ->where('status', true)
            ->with(['recipeType', 'ingredients.item.unit', 'ingredients.unit'])
            ->get();

        $snapshots = MarketPriceSnapshot::where('market_id', $stall->market_id)
            ->whereIn('item_id', $dishes->flatMap(fn (PalutoDish $dish) => $dish->ingredients->pluck('item_id'))->unique())
            ->get()
            ->keyBy('item_id');

        return response()->json($this->formatStall($stall) + [
            'dishes' => $dishes->map(fn (PalutoDish $dish) => [
                'id' => $dish->id,
                'name' => $dish->name,
                'description' => $dish->description,
                'image' => $dish->image_full_url,
                'recipe_type' => $dish->recipeType?->name,
                'pricing_unit' => $dish->pricing_unit,
                'base_quantity' => $dish->base_quantity,
                'rate' => $dish->rate,
                'minimum_fee' => $dish->minimum_fee,
                'ingredients' => $dish->ingredients->map(function (PalutoDishIngredient $ingredient) use ($snapshots) {
                    $snapshot = $snapshots[$ingredient->item_id] ?? null;

                    return [
                        'id' => $ingredient->id,
                        'item_id' => $ingredient->item_id,
                        'name' => $ingredient->item?->name,
                        'image' => $ingredient->item?->image_full_url,
                        'kind' => $ingredient->kind,
                        'quantity' => $ingredient->quantity,
                        'unit' => $ingredient->unit?->short_name ?? $ingredient->item?->unit?->short_name,
                        'is_optional' => $ingredient->is_optional,
                        'is_provided' => $ingredient->is_provided,
                        'note' => $ingredient->note,
                        // Per-unit price at this stall's market, as the cart will charge
                        // it; null when the market has no current price for the item.
                        'unit_price' => $snapshot
                            ? number_format(PriceDisplay::markedUp($snapshot->price), 2, '.', '')
                            : null,
                    ];
                })->values(),
            ])->values(),
        ]);
    }

    private function formatStall(PalutoStall $stall): array
    {
        return [
            'id' => $stall->id,
            'market_id' => $stall->market_id,
            'name' => $stall->name,
            'description' => $stall->description,
            'image' => $stall->image_full_url,
            'contact_phone' => $stall->contact_phone,
            'is_accepting_orders' => $stall->is_accepting_orders,
            'prep_time_minutes' => $stall->prep_time_minutes,
        ];
    }
}
