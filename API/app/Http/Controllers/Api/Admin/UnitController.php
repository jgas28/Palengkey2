<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('short_name', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $units = $query
            ->withCount(['items as active_items_count' => fn ($q) => $q->where('status', 1)])
            ->orderBy('name')
            ->paginate(15);

        return response()->json($units);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
        ]);

        $unit = DB::transaction(function () use ($request) {
            if (Unit::whereRaw('LOWER(name)=?', [strtolower($request->name)])->where('status', 1)->exists()) {
                abort(422, 'Unit already exists.');
            }

            $unit = Unit::create([
                'name' => trim($request->name),
                'short_name' => trim($request->short_name),
            ]);

            AuditLogger::log('created', $unit, $unit->id, null, $unit->toArray());

            return $unit;
        });

        return response()->json($unit, 201);
    }

    public function update(Request $request, Unit $unit)
    {
        abort_if(! $unit->status, 404);

        $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
        ]);

        DB::transaction(function () use ($request, $unit) {
            $old = $unit->toArray();

            $unit->update([
                'name' => trim($request->name),
                'short_name' => trim($request->short_name),
            ]);

            AuditLogger::log('updated', $unit, $unit->id, $old, $unit->fresh()->toArray());
        });

        return response()->json($unit->fresh());
    }

    public function destroy(Unit $unit)
    {
        $old = $unit->toArray();

        if (! $unit->deactivate()) {
            return response()->json(['message' => 'Unit has active items.'], 422);
        }

        AuditLogger::log('deactivated', $unit, $unit->id, $old, null);

        return response()->json($unit->fresh());
    }

    public function restore($id)
    {
        $unit = Unit::findOrFail($id);
        $unit->restore();

        AuditLogger::log('restored', $unit, $unit->id, null, $unit->toArray());

        return response()->json($unit->fresh());
    }
}
