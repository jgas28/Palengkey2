<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class StoredImage
{
    /**
     * A copied record gets its own image file: replacing a record's image deletes
     * the old file, which would otherwise remove the original's picture too.
     * Images outside `$folder` are never deleted by the copy's controller, so
     * their path is simply shared. Returns null if the original file is missing.
     */
    public static function copy(?string $image, string $folder, string $name, string $disk): ?string
    {
        if (! $image || ! str_starts_with($image, $folder.'/')) {
            return $image;
        }

        return self::duplicate($image, $folder, $name, $disk);
    }

    /**
     * Copies the file into `$folder` under a new name and returns the new path,
     * or null if there is no image or the original file is missing.
     */
    public static function duplicate(?string $image, string $folder, string $name, string $disk): ?string
    {
        if (! $image) {
            return null;
        }

        $extension = pathinfo($image, PATHINFO_EXTENSION) ?: 'jpg';
        $newPath = $folder.'/'.Str::slug($name).'-'.uniqid().'.'.$extension;

        try {
            return Storage::disk($disk)->copy($image, $newPath) ? $newPath : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
