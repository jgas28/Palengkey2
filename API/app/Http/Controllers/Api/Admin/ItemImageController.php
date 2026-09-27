<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ItemImageController extends Controller
{
    public function store(Request $request, Item $item)
    {
        $user = $request->user();
        if ($user->role !== 'super_admin' && ! $this->itemBelongsToMarket($item, $user->market_id)) {
            abort(403);
        }

        $data = $request->validate(['images' => 'required|array|min:1', 'images.*' => 'image|max:4096']);

        $disk = $this->disk();
        $nextSortOrder = (int) $item->images()->max('sort_order') + 1;

        $images = collect($data['images'])->map(function ($file, $index) use ($item, $nextSortOrder, $disk) {
            $path = $file->storeAs('items/gallery', Str::slug($item->name).'-'.uniqid().'.'.$file->extension(), $disk);

            return ItemImage::create([
                'item_id' => $item->id,
                'image_path' => $path,
                'sort_order' => $nextSortOrder + $index,
            ]);
        });

        return response()->json(
            $images->map(fn (ItemImage $image) => ['id' => $image->id, 'url' => $image->image_url, 'sort_order' => $image->sort_order]),
            201,
        );
    }

    public function destroy(Request $request, Item $item, ItemImage $image)
    {
        $user = $request->user();
        if ($user->role !== 'super_admin' && ! $this->itemBelongsToMarket($item, $user->market_id)) {
            abort(403);
        }

        if ($image->item_id !== $item->id) {
            abort(404);
        }

        Storage::disk($this->disk())->delete($image->image_path);
        $image->delete();

        return response()->json(['message' => 'Image removed.']);
    }

    private function itemBelongsToMarket(Item $item, ?int $marketId): bool
    {
        return $marketId && $item->markets()->where('market_id', $marketId)->exists();
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
