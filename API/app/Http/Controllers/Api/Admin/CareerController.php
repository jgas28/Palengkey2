<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Career;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class CareerController extends Controller
{
    public function index(Request $request)
    {
        $query = Career::with('createdBy:id,fname,lname');

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('title', 'like', $like)->orWhere('location', 'like', $like));
        }

        $status = $request->query('status');
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function show(Career $career)
    {
        return response()->json($career->load('createdBy:id,fname,lname'));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['title'] = ucfirst(trim($data['title']));
        $data['created_by'] = $request->user()->id;

        $career = Career::create($data);
        AuditLogger::log('career_created', $career, $career->id, null, $career->toArray());

        return response()->json($career->fresh('createdBy:id,fname,lname'), 201);
    }

    public function update(Request $request, Career $career)
    {
        $data = $this->validated($request, $career->id);
        $data['title'] = ucfirst(trim($data['title']));

        $old = $career->toArray();
        $career->update($data);

        AuditLogger::log('career_updated', $career, $career->id, $old, $career->fresh()->toArray());

        return response()->json($career->fresh('createdBy:id,fname,lname'));
    }

    public function destroy(Career $career)
    {
        $old = $career->toArray();
        $career->delete();

        AuditLogger::log('career_deleted', $career, $career->id, $old, null);

        return response()->json(['message' => 'Job listing deleted.']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title' => 'required|string|max:255|unique:careers,title,'.($ignoreId ?? 'NULL').',id',
            'description' => 'required|string',
            'responsibilities' => 'required|string',
            'requirements' => 'required|string',
            'location' => 'required|string|max:255',
            'job_type' => 'required|in:full-time,part-time,contract',
            'salary_range' => 'nullable|string|max:255',
            'status' => 'required|in:open,filled,closed',
            'expires_at' => 'nullable|date|after_or_equal:today',
            'is_active' => 'boolean',
        ]);
    }
}
