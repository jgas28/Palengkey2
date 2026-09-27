<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Type;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TypeController extends Controller
{
    public function index(Request $request)
    {
        $query = Type::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->query('search').'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $types = $query
            ->withCount(['items as active_items_count' => fn ($q) => $q->where('status', 1)])
            ->orderBy('name')
            ->paginate(15);

        return response()->json($types);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $type = DB::transaction(function () use ($request) {
            if (Type::whereRaw('LOWER(name)=?', [strtolower($request->name)])->where('status', 1)->exists()) {
                abort(422, 'Type already exists.');
            }

            $type = Type::create(['name' => trim($request->name)]);

            AuditLogger::log('created', $type, $type->id, null, $type->toArray());

            return $type;
        });

        return response()->json($type, 201);
    }

    public function update(Request $request, Type $type)
    {
        abort_if(! $type->status, 404);

        $request->validate(['name' => 'required|string|max:255']);

        DB::transaction(function () use ($request, $type) {
            $old = $type->toArray();

            $type->update(['name' => trim($request->name)]);

            AuditLogger::log('updated', $type, $type->id, $old, $type->fresh()->toArray());
        });

        return response()->json($type->fresh());
    }

    public function destroy(Type $type)
    {
        $old = $type->toArray();

        if (! $type->deactivate()) {
            return response()->json(['message' => 'Type has active items.'], 422);
        }

        AuditLogger::log('deactivated', $type, $type->id, $old, null);

        return response()->json($type->fresh());
    }

    public function restore($id)
    {
        $type = Type::findOrFail($id);
        $type->restore();

        AuditLogger::log('restored', $type, $type->id, null, $type->toArray());

        return response()->json($type->fresh());
    }
}
