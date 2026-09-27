<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HeroContentController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(HeroContent::byPage($request->query('page_name', 'home')));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, true);

        $path = Storage::disk($this->disk())->putFile('hero-content', $request->file('image'));
        $data['image_url'] = Storage::disk($this->disk())->url($path);
        unset($data['image']);

        $data['created_by'] = $request->user()->id;
        $data['is_active'] = $request->boolean('is_active');

        if ($data['is_active']) {
            $data['sequence'] = $this->nextSequence($data['page_name']);
        }

        $heroContent = HeroContent::create($data);

        return response()->json($heroContent, 201);
    }

    public function update(Request $request, HeroContent $heroContent)
    {
        $data = $this->validated($request, false);

        if ($request->hasFile('image')) {
            $path = Storage::disk($this->disk())->putFile('hero-content', $request->file('image'));
            $data['image_url'] = Storage::disk($this->disk())->url($path);
        }
        unset($data['image']);

        $data['is_active'] = $request->boolean('is_active');

        if ($data['is_active'] && ! $heroContent->is_active) {
            $data['sequence'] = $this->nextSequence($data['page_name']);
        }

        $heroContent->update($data);

        return response()->json($heroContent->fresh());
    }

    public function destroy(HeroContent $heroContent)
    {
        $heroContent->delete();

        return response()->json(['message' => 'Hero content deleted.']);
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'heroes' => 'required|array',
            'heroes.*.id' => 'required|integer|exists:hero_contents,id',
            'heroes.*.sequence' => 'required|integer|min:0',
        ]);

        foreach ($data['heroes'] as $item) {
            HeroContent::find($item['id'])->update(['sequence' => $item['sequence']]);
        }

        return response()->json(['message' => 'Order updated.']);
    }

    private function validated(Request $request, bool $imageRequired): array
    {
        return $request->validate([
            'page_name' => 'required|in:home,global',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'max:10240'],
            'cta_text' => 'required|string|max:100',
            'cta_link' => 'required|url',
            'cta_text_2' => 'nullable|string|max:100',
            'cta_link_2' => 'nullable|url',
            'is_active' => 'boolean',
        ]);
    }

    private function nextSequence(string $pageName): int
    {
        $maxSequence = HeroContent::where('page_name', $pageName)->where('is_active', true)->max('sequence');

        return ($maxSequence ?? -1) + 1;
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
