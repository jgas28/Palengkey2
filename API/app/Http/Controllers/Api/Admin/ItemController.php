<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketItem;
use App\Models\MarketPriceSnapshot;
use App\Services\AuditLogger;
use App\Services\PriceRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $marketId = $this->resolveMarketId($request, $user);

        $query = Item::query()->with(['category', 'type', 'unit', 'images']);

        if ($marketId) {
            $query->whereHas('markets', fn ($q) => $q->where('market_id', $marketId));
        }

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        $status = $request->query('status');
        if ($status !== null) {
            $query->where('status', (int) $status);
        }

        $items = $query->orderBy('name')->paginate(20);
        $items->getCollection()->transform(fn (Item $item) => $this->formatItem($item, $marketId));

        return response()->json($items);
    }

    public function show(Request $request, Item $item)
    {
        $marketId = $this->resolveMarketId($request, $request->user());

        return response()->json(
            $this->formatItem($item->load(['category', 'type', 'unit', 'images']), $marketId),
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === 'super_admin';

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:items,name,NULL,id,status,1',
            'description' => 'nullable|string',
            'picture_url' => 'required|image|max:4096',
            'category_id' => 'required|exists:categories,id,status,1',
            'type_id' => 'nullable|exists:types,id,status,1',
            'unit_id' => 'required|exists:units,id,status,1',
            'bulk_min_kg' => 'nullable|numeric|min:0.001|max:9999',
            'price' => 'required|numeric|min:0',
            'is_available' => 'boolean',
            'cutoff_time' => 'nullable|date_format:H:i',
            'market_id' => $isSuperAdmin ? 'required|exists:markets,id' : 'nullable',
        ]);

        $marketId = $isSuperAdmin ? (int) $data['market_id'] : $user->market_id;

        if (! $marketId) {
            return response()->json(['message' => 'Your account is not assigned to a market.'], 422);
        }

        $disk = $this->disk();
        $path = $request->file('picture_url')->storeAs(
            'items',
            Str::slug($data['name']).'-'.uniqid().'.'.$request->file('picture_url')->extension(),
            $disk,
        );

        try {
            $item = DB::transaction(function () use ($data, $path, $marketId) {
                $item = Item::create([
                    'name' => trim($data['name']),
                    'description' => $data['description'] ?? null,
                    'picture_url' => $path,
                    'category_id' => $data['category_id'],
                    'type_id' => $data['type_id'] ?? null,
                    'unit_id' => $data['unit_id'],
                    'bulk_min_kg' => $data['bulk_min_kg'] ?? null,
                ]);

                AuditLogger::log('created', $item, $item->id, null, $item->toArray());

                PriceRecorder::record($marketId, $item->id, $data['price'], $data['is_available'] ?? true);

                if (! empty($data['cutoff_time'])) {
                    MarketItem::where('market_id', $marketId)->where('item_id', $item->id)->update([
                        'cutoff_time' => $data['cutoff_time'],
                        'cutoff_timezone' => Market::find($marketId)?->cutoff_timezone ?? 'Asia/Manila',
                    ]);
                }

                return $item;
            });
        } catch (\Throwable $e) {
            Storage::disk($disk)->delete($path);
            throw $e;
        }

        return response()->json(
            $this->formatItem($item->fresh(['category', 'type', 'unit', 'images']), $marketId),
            201,
        );
    }

    public function update(Request $request, Item $item)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin' && ! $this->itemBelongsToMarket($item, $user->market_id)) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:items,name,'.$item->id.',id,status,1',
            'description' => 'nullable|string',
            'category_id' => 'sometimes|required|exists:categories,id,status,1',
            'type_id' => 'nullable|exists:types,id,status,1',
            'unit_id' => 'sometimes|required|exists:units,id,status,1',
            // Overrides the category's bulk threshold; blank = use the category's.
            'bulk_min_kg' => 'nullable|numeric|min:0.001|max:9999',
        ]);

        $item->update($data);
        AuditLogger::log('updated', $item, $item->id, null, $data);

        $marketId = $this->resolveMarketId($request, $user);

        return response()->json(
            $this->formatItem($item->fresh(['category', 'type', 'unit', 'images']), $marketId),
        );
    }

    /** Deactivates rather than hard-deletes; blocked if the item has price history to preserve order/audit trail integrity. */
    public function destroy(Request $request, Item $item)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin' && ! $this->itemBelongsToMarket($item, $user->market_id)) {
            abort(403);
        }

        if ($item->hasPriceHistory()) {
            return response()->json(['message' => 'Cannot deactivate an item with price history.'], 422);
        }

        $old = $item->toArray();
        $item->update(['status' => false]);

        AuditLogger::log('deactivated', $item, $item->id, $old, null);

        return response()->json(['message' => 'Item deactivated.']);
    }

    public function restore(Request $request, $id)
    {
        $item = Item::findOrFail($id);
        $user = $request->user();

        if ($user->role !== 'super_admin' && ! $this->itemBelongsToMarket($item, $user->market_id)) {
            abort(403);
        }

        if (! $item->category?->status || ($item->type_id && ! $item->type?->status) || ! $item->unit?->status) {
            return response()->json(['message' => 'Cannot restore: category, type, or unit is inactive.'], 422);
        }

        $item->update(['status' => true]);
        AuditLogger::log('restored', $item, $item->id, null, $item->toArray());

        return response()->json(['message' => 'Item restored.']);
    }

    private function resolveMarketId(Request $request, $user): ?int
    {
        if ($user->role === 'super_admin') {
            $marketId = $request->query('market_id') ?? $request->input('market_id');

            return $marketId ? (int) $marketId : null;
        }

        return $user->market_id;
    }

    private function itemBelongsToMarket(Item $item, ?int $marketId): bool
    {
        if (! $marketId) {
            return false;
        }

        return MarketItem::where('item_id', $item->id)->where('market_id', $marketId)->exists();
    }

    private function formatItem(Item $item, ?int $marketId): array
    {
        $marketItem = $marketId
            ? MarketItem::where('item_id', $item->id)->where('market_id', $marketId)->first()
            : null;

        $snapshot = $marketId
            ? MarketPriceSnapshot::where('item_id', $item->id)->where('market_id', $marketId)->first()
            : null;

        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'image_url' => $item->image_full_url,
            'status' => $item->status,
            'category_id' => $item->category_id,
            'category' => $item->category?->name,
            'type_id' => $item->type_id,
            'type' => $item->type?->name,
            'unit_id' => $item->unit_id,
            'unit' => $item->unit?->name,
            'bulk_min_kg' => $item->bulk_min_kg,
            'category_bulk_min_kg' => $item->category?->bulk_min_kg,
            'images' => $item->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => $image->image_url,
                'sort_order' => $image->sort_order,
            ]),
            'market' => $marketId ? [
                'market_id' => $marketId,
                'price' => $snapshot?->price,
                'is_available' => (bool) ($marketItem?->is_available ?? false),
                'cutoff_time' => $marketItem?->cutoff_time ? substr($marketItem->cutoff_time, 0, 5) : null,
            ] : null,
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
