<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PalutoStall;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PalutoStallController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $marketId = $request->query('market_id');
        $status = $request->query('status');

        $query = PalutoStall::query()
            ->with('market')
            ->when($search !== '', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"))
            ->when($marketId, fn (Builder $q) => $q->where('market_id', $marketId))
            ->when($status !== null, fn (Builder $q) => $q->where('status', (int) $status))
            ->orderBy('name');

        $stalls = $query->paginate(20);
        $stalls->getCollection()->transform(fn (PalutoStall $stall) => $this->formatStall($stall));

        return response()->json($stalls);
    }

    public function show(PalutoStall $stall)
    {
        return response()->json($this->formatStall($stall->load('market')));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'market_id' => 'required|exists:markets,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:50',
            'status' => 'boolean',
            'is_accepting_orders' => 'boolean',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->storeAs(
                'paluto-stalls',
                Str::slug($data['name']).'-'.uniqid().'.'.$request->file('image')->extension(),
                $this->disk(),
            );
        }

        $data['status'] = $data['status'] ?? true;
        $data['is_accepting_orders'] = $data['is_accepting_orders'] ?? true;

        $stall = PalutoStall::create($data);
        AuditLogger::log('paluto_stall_created', $stall, $stall->id, null, $stall->toArray());

        return response()->json($this->formatStall($stall->fresh('market')), 201);
    }

    public function update(Request $request, PalutoStall $stall)
    {
        $data = $request->validate([
            'market_id' => 'sometimes|required|exists:markets,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:50',
            'status' => 'boolean',
            'is_accepting_orders' => 'boolean',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:4096',
        ]);

        $old = $stall->toArray();

        if ($request->hasFile('image')) {
            if ($stall->image) {
                Storage::disk($this->disk())->delete($stall->image);
            }

            $data['image'] = $request->file('image')->storeAs(
                'paluto-stalls',
                Str::slug($data['name'] ?? $stall->name).'-'.uniqid().'.'.$request->file('image')->extension(),
                $this->disk(),
            );
        }

        $stall->update($data);
        AuditLogger::log('paluto_stall_updated', $stall, $stall->id, $old, $stall->fresh()->toArray());

        return response()->json($this->formatStall($stall->fresh('market')));
    }

    /** Deactivates rather than hard-deletes — stalls are referenced by orders. */
    public function destroy(PalutoStall $stall)
    {
        $old = $stall->toArray();
        $stall->update(['status' => false]);

        AuditLogger::log('paluto_stall_deactivated', $stall, $stall->id, $old, null);

        return response()->json([
            'message' => 'Paluto stall deactivated.',
            'stall' => $this->formatStall($stall->fresh('market')),
        ]);
    }

    public function restore(PalutoStall $stall)
    {
        $stall->update(['status' => true]);
        AuditLogger::log('paluto_stall_restored', $stall, $stall->id, null, $stall->toArray());

        return response()->json([
            'message' => 'Paluto stall restored.',
            'stall' => $this->formatStall($stall->fresh('market')),
        ]);
    }

    private function formatStall(PalutoStall $stall): array
    {
        return [
            'id' => $stall->id,
            'market_id' => $stall->market_id,
            'market_name' => $stall->market?->name,
            'name' => $stall->name,
            'description' => $stall->description,
            'image_url' => $stall->image_full_url,
            'contact_phone' => $stall->contact_phone,
            'status' => $stall->status,
            'is_accepting_orders' => $stall->is_accepting_orders,
            'prep_time_minutes' => $stall->prep_time_minutes,
            'created_at' => $stall->created_at,
        ];
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
