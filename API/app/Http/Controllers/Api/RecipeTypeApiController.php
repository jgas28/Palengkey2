<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecipeType;
use Illuminate\Http\JsonResponse;

class RecipeTypeApiController extends Controller
{
    public function index(): JsonResponse
    {
        $recipeTypes = RecipeType::query()
            ->where('status', 1)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $recipeTypes]);
    }
}
