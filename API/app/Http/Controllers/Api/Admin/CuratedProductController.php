<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CuratedProduct;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CuratedProductController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'section' => ['required', Rule::in(array_keys(CuratedProduct::SECTIONS))],
        ]);

        $curated = CuratedProduct::where('section', $data['section'])
            ->with('item:id,name,picture_url,category_id')
            ->with('item.category:id,name')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (CuratedProduct $curatedProduct) => $this->formatEntry($curatedProduct));

        return response()->json(['data' => $curated]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'section' => ['required', Rule::in(array_keys(CuratedProduct::SECTIONS))],
            'item_id' => [
                'required',
                'integer',
                'exists:items,id',
                Rule::unique('curated_products')->where('section', $request->input('section')),
            ],
        ], [
            'item_id.unique' => 'This item is already curated for this section.',
        ]);

        $curatedProduct = CuratedProduct::create([
            'section' => $data['section'],
            'item_id' => $data['item_id'],
            'sort_order' => $this->nextSortOrder($data['section']),
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($this->formatEntry($curatedProduct->load('item.category')), 201);
    }

    public function update(Request $request, CuratedProduct $curatedProduct)
    {
        $data = $request->validate([
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $curatedProduct->update($data);

        return response()->json($this->formatEntry($curatedProduct->fresh('item.category')));
    }

    public function destroy(CuratedProduct $curatedProduct)
    {
        $curatedProduct->delete();

        return response()->json(['message' => 'Removed from curated list.']);
    }

    private function nextSortOrder(string $section): int
    {
        $maxSortOrder = CuratedProduct::where('section', $section)->max('sort_order');

        return ($maxSortOrder ?? -1) + 1;
    }

    private function formatEntry(CuratedProduct $curatedProduct): array
    {
        return [
            'id' => $curatedProduct->id,
            'section' => $curatedProduct->section,
            'sort_order' => $curatedProduct->sort_order,
            'is_active' => $curatedProduct->is_active,
            'item' => [
                'id' => $curatedProduct->item->id,
                'name' => $curatedProduct->item->name,
                'image' => $curatedProduct->item->image_full_url,
                'category' => $curatedProduct->item->category?->name,
            ],
        ];
    }
}
