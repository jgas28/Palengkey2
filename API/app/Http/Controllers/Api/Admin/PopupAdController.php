<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PopupAd;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PopupAdController extends Controller
{
    public function index(Request $request)
    {
        $query = PopupAd::with('voucher')->orderBy('sort_order')->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, true);
        $data['created_by'] = $request->user()->id;
        $data['is_active'] = $request->boolean('is_active');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        $data['image_path'] = Storage::disk($this->disk())->putFile('popup-ads', $request->file('image'));

        $popupAd = PopupAd::create($data);

        return response()->json($popupAd->load('voucher'), 201);
    }

    public function update(Request $request, PopupAd $popupAd)
    {
        $data = $this->validated($request, false);
        $data['is_active'] = $request->boolean('is_active');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        if ($request->hasFile('image')) {
            $oldImagePath = $popupAd->image_path;
            $data['image_path'] = Storage::disk($this->disk())->putFile('popup-ads', $request->file('image'));
            if ($oldImagePath) {
                Storage::disk($this->disk())->delete($oldImagePath);
            }
        }

        $popupAd->update($data);

        return response()->json($popupAd->fresh('voucher'));
    }

    public function destroy(PopupAd $popupAd)
    {
        $imagePath = $popupAd->image_path;
        $popupAd->delete();

        if ($imagePath) {
            Storage::disk($this->disk())->delete($imagePath);
        }

        return response()->json(['message' => 'Popup ad deleted.']);
    }

    public function vouchers()
    {
        return response()->json(Voucher::orderBy('code')->get(['id', 'code', 'description', 'is_active']));
    }

    private function validated(Request $request, bool $imageRequired): array
    {
        return $request->validate([
            'type' => ['required', Rule::in(array_keys(PopupAd::TYPES))],
            'voucher_id' => ['nullable', 'exists:vouchers,id'],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'badge_text' => ['nullable', 'string', 'max:80'],
            'cta_label' => ['nullable', 'string', 'max:80'],
            'cta_url' => [
                'nullable', 'string', 'max:500',
                function ($attribute, $value, $fail) {
                    if (preg_match('/^\s*javascript:/i', (string) $value)) {
                        $fail('The call-to-action URL is not allowed.');
                    }
                },
            ],
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'max:5120'],
            'is_active' => ['boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999999'],
        ]);
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
