<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MarketController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $query = Market::query()
            ->when($search !== '', function (Builder $q) use ($search) {
                $like = '%'.$search.'%';
                $q->where(fn (Builder $sub) => $sub->where('name', 'like', $like)
                    ->orWhere('location', 'like', $like)
                    ->orWhere('address', 'like', $like));
            })
            ->when($status !== null, fn (Builder $q) => $q->where('status', (int) $status))
            // Active (1) first, then coming-soon (2), then inactive (0).
            ->orderByRaw('CASE WHEN status = 1 THEN 1 WHEN status = 2 THEN 2 ELSE 3 END')
            ->latest();

        $markets = $query->paginate(20);
        $markets->getCollection()->transform(fn (Market $market) => $this->formatMarket($market));

        return response()->json($markets);
    }

    public function show(Market $market)
    {
        return response()->json($this->formatMarket($market));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'status' => 'nullable|integer|in:0,1,2',
            'cutoff_time' => 'nullable|date_format:H:i',
            'cutoff_timezone' => 'nullable|timezone',
            'image' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->storeAs(
                'markets',
                Str::slug($data['name']).'-'.uniqid().'.'.$request->file('image')->extension(),
                $this->disk(),
            );
        }

        $data['cutoff_time'] = $data['cutoff_time'] ?? '17:00';
        $data['cutoff_timezone'] = $data['cutoff_timezone'] ?? 'Asia/Manila';

        $market = Market::create($data);
        AuditLogger::log('market_created', $market, $market->id, null, $market->toArray());

        return response()->json($this->formatMarket($market), 201);
    }

    public function update(Request $request, Market $market)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'status' => 'sometimes|integer|in:0,1,2',
            'cutoff_time' => 'nullable|date_format:H:i',
            'cutoff_timezone' => 'nullable|timezone',
            'image' => 'nullable|image|max:4096',
        ]);

        $old = $market->toArray();

        if ($request->hasFile('image')) {
            if ($market->image) {
                Storage::disk($this->disk())->delete($market->image);
            }

            $data['image'] = $request->file('image')->storeAs(
                'markets',
                Str::slug($data['name'] ?? $market->name).'-'.uniqid().'.'.$request->file('image')->extension(),
                $this->disk(),
            );
        }

        $market->update($data);
        AuditLogger::log('market_updated', $market, $market->id, $old, $market->fresh()->toArray());

        return response()->json($this->formatMarket($market->fresh()));
    }

    /** Deactivate rather than hard-delete — markets are referenced by items, orders, users, and riders. */
    public function destroy(Market $market)
    {
        $old = $market->toArray();
        $market->update(['status' => 0]);

        AuditLogger::log('market_deactivated', $market, $market->id, $old, null);

        return response()->json(['message' => 'Market deactivated.', 'market' => $this->formatMarket($market->fresh())]);
    }

    private function formatMarket(Market $market): array
    {
        $disk = $this->disk();

        return [
            'id' => $market->id,
            'name' => $market->name,
            'location' => $market->location,
            'address' => $market->address,
            'latitude' => $market->latitude,
            'longitude' => $market->longitude,
            'status' => $market->status,
            'cutoff_time' => $market->cutoff_time ? substr($market->cutoff_time, 0, 5) : null,
            'cutoff_timezone' => $market->cutoff_timezone,
            'image_url' => $market->image ? Storage::disk($disk)->url($market->image) : null,
            'created_at' => $market->created_at,
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
