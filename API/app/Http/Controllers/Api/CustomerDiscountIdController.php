<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountId;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The customer's PWD / Senior Citizen ID. Uploaded once; an admin approves it,
 * and then the discount can be turned on at checkout.
 */
class CustomerDiscountIdController extends Controller
{
    public function show(Request $request)
    {
        $latest = DiscountId::where('customer_id', $request->user()->id)->latest('id')->first();

        return response()->json(['discount_id' => $latest ? $this->present($latest) : null]);
    }

    public function store(Request $request)
    {
        $customer = $request->user();

        $current = DiscountId::where('customer_id', $customer->id)
            ->whereIn('status', ['pending', 'approved'])
            ->latest('id')
            ->first();

        if ($current) {
            return response()->json([
                'message' => $current->status === 'approved'
                    ? 'Your ID is already approved.'
                    : 'Your ID is already being reviewed.',
            ], 422);
        }

        $image = 'required|file|mimes:jpg,jpeg,png,webp,heic,heif|max:5120';
        $data = $request->validate([
            'type' => 'required|in:'.implode(',', array_keys(DiscountId::TYPES)),
            'id_number' => 'required|string|min:3|max:50',
            'full_name' => 'required|string|max:255',
            'front' => $image,
            'back' => $image,
            'selfie' => str_replace('required', 'nullable', $image),
        ]);

        // Private storage: IDs are only shown to admins through the review endpoint.
        $disk = config('filesystems.disks.s3.key') ? 's3' : 'local';
        $stored = [];

        try {
            foreach (['front', 'back', 'selfie'] as $side) {
                if ($request->hasFile($side)) {
                    $stored[$side] = $this->storeFile($request->file($side), $disk, $customer->id);
                }
            }

            $discountId = DiscountId::create([
                'customer_id' => $customer->id,
                'type' => $data['type'],
                'id_number' => strip_tags(trim($data['id_number'])),
                'full_name' => strip_tags(trim($data['full_name'])),
                'disk' => $disk,
                'front_path' => $stored['front'],
                'back_path' => $stored['back'],
                'selfie_path' => $stored['selfie'] ?? null,
                'status' => 'pending',
            ]);
        } catch (\Throwable $e) {
            foreach ($stored as $path) {
                Storage::disk($disk)->delete($path);
            }
            Log::error('PWD/Senior ID upload failed.', ['customer_id' => $customer->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Could not upload your ID. Please try again.'], 500);
        }

        return response()->json([
            'message' => 'ID submitted. We will review it shortly.',
            'discount_id' => $this->present($discountId),
        ], 201);
    }

    private function storeFile(UploadedFile $file, string $disk, int $customerId): string
    {
        // Named from the file's contents; a client-supplied name could end in .php.
        $name = Str::uuid().'.'.$file->extension();

        return $file->storeAs('discount-ids/'.$customerId, $name, $disk);
    }

    private function present(DiscountId $discountId): array
    {
        return [
            'id' => $discountId->id,
            'type' => $discountId->type,
            'type_label' => $discountId->typeLabel(),
            'id_number' => $discountId->id_number,
            'full_name' => $discountId->full_name,
            'status' => $discountId->status,
            'review_notes' => $discountId->status === 'rejected' ? $discountId->review_notes : null,
            'submitted_at' => $discountId->created_at,
            'reviewed_at' => $discountId->reviewed_at,
        ];
    }
}
