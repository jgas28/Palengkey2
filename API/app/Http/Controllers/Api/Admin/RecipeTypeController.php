<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RecipeType;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = RecipeType::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->query('search').'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json($query->orderBy('name')->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $recipeType = DB::transaction(function () use ($request) {
            if (RecipeType::whereRaw('LOWER(name)=?', [strtolower($request->name)])->where('status', 1)->exists()) {
                abort(422, 'Recipe type already exists.');
            }

            $recipeType = RecipeType::create(['name' => $request->name]);

            AuditLogger::log('created', $recipeType, $recipeType->id, null, $recipeType->toArray());

            return $recipeType;
        });

        return response()->json($recipeType, 201);
    }

    public function update(Request $request, RecipeType $recipeType)
    {
        abort_if(! $recipeType->status, 404);

        $request->validate(['name' => 'required|string|max:255']);

        $old = $recipeType->toArray();
        $recipeType->update(['name' => $request->name]);

        AuditLogger::log('updated', $recipeType, $recipeType->id, $old, $recipeType->fresh()->toArray());

        return response()->json($recipeType->fresh());
    }

    public function destroy(RecipeType $recipeType)
    {
        $old = $recipeType->toArray();
        $recipeType->update(['status' => false]);

        AuditLogger::log('deactivated', $recipeType, $recipeType->id, $old, null);

        return response()->json($recipeType->fresh());
    }

    public function restore($id)
    {
        $recipeType = RecipeType::findOrFail($id);
        $recipeType->update(['status' => true]);

        AuditLogger::log('restored', $recipeType, $recipeType->id, null, $recipeType->toArray());

        return response()->json($recipeType->fresh());
    }
}
