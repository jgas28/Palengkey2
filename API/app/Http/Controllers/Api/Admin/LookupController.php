<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Market;
use App\Models\RecipeType;
use App\Models\Type;
use App\Models\Unit;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    public function categories()
    {
        return response()->json(Category::active()->orderBy('name')->get(['id', 'name']));
    }

    public function types()
    {
        return response()->json(Type::active()->orderBy('name')->get(['id', 'name']));
    }

    public function units()
    {
        return response()->json(Unit::active()->orderBy('name')->get(['id', 'name', 'short_name']));
    }

    public function recipeTypes()
    {
        return response()->json(RecipeType::active()->orderBy('name')->get(['id', 'name']));
    }

    /** Super admin only — lets them pick which market to act on. */
    public function markets(Request $request)
    {
        abort_unless($request->user()->role === 'super_admin', 403);

        return response()->json(Market::orderBy('name')->get(['id', 'name', 'location', 'status']));
    }
}
