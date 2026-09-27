<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Career;

class CareerApiController extends Controller
{
    public function index()
    {
        $careers = Career::active()
            ->latest()
            ->get()
            ->map(fn (Career $career) => [
                'id' => $career->id,
                'title' => $career->title,
                'description' => $career->description,
                'responsibilities' => $career->responsibilities,
                'requirements' => $career->requirements,
                'location' => $career->location,
                'job_type' => $career->job_type,
                'salary_range' => $career->salary_range,
            ]);

        return response()->json($careers);
    }
}
