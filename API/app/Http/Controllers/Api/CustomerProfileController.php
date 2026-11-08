<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    /**
     * Profile photos were dropped (S3 storage cost); avatars are the customer's
     * initials. Kept as a route so older app versions get a clear answer.
     */
    public function updateImage()
    {
        return response()->json(['message' => 'Profile photos are no longer supported.'], 410);
    }

    /** Still lets customers clear a photo uploaded before photos were dropped. */

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
