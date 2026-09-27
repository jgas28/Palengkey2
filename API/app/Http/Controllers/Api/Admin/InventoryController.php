<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\MarketItem;
use App\Models\MarketPriceSnapshot;
use App\Services\AuditLogger;
use App\Services\InventoryCsvParser;
use App\Services\PriceRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Combined inventory board + bulk pricing — one screen per market for setting price/availability/cutoff across the catalog. */
class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $marketId = $this->resolveMarketId($request, $request->user());
        if (! $marketId) {
            return response()->json(['message' => 'Choose a market.'], 422);
        }

        return response()->json(['market_id' => $marketId, 'items' => $this->board($marketId)]);
    }

    public function updateBoard(Request $request)
    {
        $marketId = $this->resolveMarketId($request, $request->user());
        if (! $marketId) {
            return response()->json(['message' => 'Choose a market.'], 422);
        }

        $data = $request->validate([
            'rows' => 'required|array',
            'rows.*.item_id' => 'required|integer|exists:items,id',
            'rows.*.price' => 'nullable|numeric',
            'rows.*.is_available' => 'required|boolean',
            'rows.*.cutoff_time' => 'nullable|string',
        ]);

        [$updated, $errors] = $this->applyRows($marketId, array_map(fn ($row) => [
            'item_id' => (int) $row['item_id'],
            'price' => isset($row['price']) ? (float) $row['price'] : null,
            'available' => (bool) $row['is_available'],
            'cutoff_time' => InventoryCsvParser::normalizeCutoffTime($row['cutoff_time'] ?? null),
        ], $data['rows']));

        AuditLogger::custom('inventory_manual_update_completed', ['market_id' => $marketId, 'updated' => $updated, 'errors' => count($errors)]);

        return response()->json(['updated' => $updated, 'errors' => $errors, 'items' => $this->board($marketId)]);
    }

    public function import(Request $request)
    {
        $marketId = $this->resolveMarketId($request, $request->user());
        if (! $marketId) {
            return response()->json(['message' => 'Choose a market.'], 422);
        }

        $request->validate(['file' => 'required|file|mimes:csv,txt|max:2048']);

        $result = InventoryCsvParser::parse($request->file('file')->getRealPath());

        [$updated, $rowErrors] = $this->applyRows($marketId, array_map(fn ($row) => [
            'item_id' => $row['item']->id,
            'price' => $row['price'],
            'available' => $row['available'],
            'cutoff_time' => $row['cutoff_time'],
        ], $result['valid']));

        $errors = array_merge($result['errors'], $rowErrors);

        AuditLogger::custom('inventory_csv_import_completed', ['market_id' => $marketId, 'updated' => $updated, 'errors' => count($errors)]);

        return response()->json(['updated' => $updated, 'errors' => $errors, 'items' => $this->board($marketId)]);
    }

    public function template(Request $request)
    {
        $marketId = $this->resolveMarketId($request, $request->user());
        if (! $marketId) {
            return response()->json(['message' => 'Choose a market.'], 422);
        }

        AuditLogger::custom('inventory_template_downloaded', ['market_id' => $marketId]);

        $board = $this->board($marketId);

        return response()->stream(function () use ($board) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['Item', 'Price', 'Available', 'CutoffTime(HH:MM)', 'Unit']);

            foreach ($board as $row) {
                fputcsv($file, [
                    $row['name'],
                    $row['price'],
                    $row['is_available'] ? 'YES' : 'NO',
                    $row['cutoff_time'],
                    $row['unit'],
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=inventory_template.csv',
        ]);
    }

    /** @param array<int, array{item_id:int,price:?float,available:bool,cutoff_time:?string}> $rows */
    private function applyRows(int $marketId, array $rows): array
    {
        $updated = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $marketId, &$updated, &$errors) {
            foreach ($rows as $row) {
                if ($row['available'] && (! $row['price'] || $row['price'] <= 0 || $row['price'] > 50000)) {
                    $errors[] = "Item #{$row['item_id']}: invalid price.";
                    continue;
                }

                PriceRecorder::record($marketId, $row['item_id'], $row['available'] ? $row['price'] : null, $row['available']);

                if ($row['cutoff_time']) {
                    MarketItem::where('market_id', $marketId)->where('item_id', $row['item_id'])
                        ->update(['cutoff_time' => $row['cutoff_time']]);
                }

                $updated++;
            }
        });

        return [$updated, $errors];
    }

    private function board(int $marketId): array
    {
        $items = Item::with('unit')->where('status', 1)->orderBy('name')->get();
        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)->get()->keyBy('item_id');
        $marketItems = MarketItem::where('market_id', $marketId)->get()->keyBy('item_id');

        return $items->map(function (Item $item) use ($snapshots, $marketItems) {
            $snapshot = $snapshots->get($item->id);
            $marketItem = $marketItems->get($item->id);

            return [
                'item_id' => $item->id,
                'name' => $item->name,
                'unit' => $item->unit?->short_name ?: $item->unit?->name,
                'price' => $snapshot?->price,
                'is_available' => (bool) ($marketItem?->is_available ?? false),
                'cutoff_time' => $marketItem?->cutoff_time ? substr($marketItem->cutoff_time, 0, 5) : null,
            ];
        })->values()->all();
    }

    private function resolveMarketId(Request $request, $user): ?int
    {
        if ($user->role === 'super_admin') {
            $marketId = $request->query('market_id') ?? $request->input('market_id');

            return $marketId ? (int) $marketId : null;
        }

        return $user->market_id;
    }
}
