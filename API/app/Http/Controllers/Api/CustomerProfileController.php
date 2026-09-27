<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomerProfileController extends Controller
{
    public function update(Request $request)
    {
        if ($request->filled('phone')) {
            $request->merge(['phone' => PhoneNumber::normalizePhilippineMobile($request->input('phone'))]);
        }

        $data = $request->validate([
            'fname' => 'sometimes|required|string|max:255',
            'lname' => 'sometimes|required|string|max:255',
            'mname' => 'nullable|string|max:255',
            'phone' => ['nullable', 'string', 'regex:'.PhoneNumber::PHILIPPINE_E164_REGEX],
        ], [
            'phone.regex' => 'Phone number must use +63 followed by 10 digits, e.g. +639171234567.',
        ]);

        $request->user()->update($data);

        return response()->json(['message' => 'Profile updated successfully']);
    }

    public function updateImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048']);

        $customer = $request->user();
        $disk = $this->disk();
        $folder = 'customers/'.$customer->id.'/profile_image';

        if (Storage::disk($disk)->exists($folder)) {
            Storage::disk($disk)->deleteDirectory($folder);
        }

        $filename = Str::uuid().'.'.$request->file('image')->extension();
        $path = $request->file('image')->storeAs($folder, $filename, $disk);

        return response()->json([
            'message' => 'Profile image updated successfully',
            'profile_image' => Storage::disk($disk)->url($path),
        ]);
    }

    public function deleteImage(Request $request)
    {
        $customer = $request->user();
        $disk = $this->disk();
        $folder = 'customers/'.$customer->id.'/profile_image';

        if (! Storage::disk($disk)->exists($folder) || empty(Storage::disk($disk)->files($folder))) {
            return response()->json(['message' => 'No profile image to remove'], 404);
        }

        Storage::disk($disk)->deleteDirectory($folder);

        return response()->json(['message' => 'Profile image removed successfully']);
    }

    /** S3 isn't configured until AWS creds are added — fall back to the local public disk. */
    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
