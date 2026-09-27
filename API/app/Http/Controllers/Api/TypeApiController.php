<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Type;
use Illuminate\Support\Facades\Cache;

class TypeApiController extends Controller
{
    public function index()
    {
        $types = Cache::remember('api_types', now()->addHours(6), function () {
            return Type::where('status', 1)
                ->orderBy('name')
                ->get()
                ->map(fn (Type $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'is_halal' => str_contains(strtolower($type->name), 'halal'),
                ]);
        });

        return response()->json(['data' => $types]);
    }
}
