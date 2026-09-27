<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->query('search').'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $categories = $query
            ->withCount(['items as active_items_count' => fn ($q) => $q->where('status', 1)])
            ->orderBy('name')
            ->paginate(15);

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255', 'image' => 'nullable|image|max:2048']);

        $category = DB::transaction(function () use ($request) {
            if (Category::whereRaw('LOWER(name)=?', [strtolower($request->name)])->where('status', 1)->exists()) {
                abort(422, 'Category already exists.');
            }

            $data = ['name' => $request->name];

            if ($request->hasFile('image')) {
                $data['image'] = $request->file('image')->store('categories', $this->disk());
            }

            $category = Category::create($data);

            AuditLogger::log('created', $category, $category->id, null, $category->toArray());

            return $category;
        });

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        abort_if(! $category->status, 404);

        $request->validate(['name' => 'required|string|max:255', 'image' => 'nullable|image|max:2048']);

        DB::transaction(function () use ($request, $category) {
            $old = $category->toArray();
            $data = ['name' => $request->name];

            if ($request->hasFile('image')) {
                if ($category->image) {
                    Storage::disk($this->disk())->delete($category->image);
                }
                $data['image'] = $request->file('image')->store('categories', $this->disk());
            }

            $category->update($data);

            AuditLogger::log('updated', $category, $category->id, $old, $category->fresh()->toArray());
        });

        return response()->json($category->fresh());
    }

    public function destroy(Category $category)
    {
        $old = $category->toArray();

        if (! $category->deactivate()) {
            return response()->json(['message' => 'Category has active items.'], 422);
        }

        AuditLogger::log('deactivated', $category, $category->id, $old, null);

        return response()->json($category->fresh());
    }

    public function restore($id)
    {
        $category = Category::findOrFail($id);
        $category->restore();

        AuditLogger::log('restored', $category, $category->id, null, $category->toArray());

        return response()->json($category->fresh());
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
