<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Customer;
use App\Models\IdSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Only reachable once a customer has skipped identity verification (Phase 1 doesn't
 * yet expose /customer/verification/skip, so this path is currently dead code — kept
 * ready for when that endpoint ships) and needs a one-time COD ID/selfie upload.
 */
trait HandlesCodVerificationUploads
{
    protected function validateCodDetailsCompletion(Request $request): array
    {
        return $request->validate([
            'cod_id_type' => 'required|string|in:nbi,passport,drivers_license,sss,tin,voters_id,postal_id,umid',
            'cod_id_number' => 'required|string|max:50',
            'cod_full_name' => 'required|string|max:255',
            'cod_date_of_birth' => 'required|date',
            'cod_id_document' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'cod_selfie' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ], [
            'cod_id_type.required' => 'Please select an ID type before using COD.',
            'cod_id_type.in' => 'Please select one of the listed ID types before using COD.',
            'cod_id_number.required' => 'Please enter your ID number before using COD.',
            'cod_full_name.required' => 'Please enter your full name as shown on your ID before using COD.',
            'cod_date_of_birth.required' => 'Please enter your date of birth before using COD.',
            'cod_id_document.required' => 'Please upload your ID document before using COD.',
            'cod_id_document.image' => 'Your COD ID document must be an image file.',
            'cod_id_document.max' => 'Your COD ID document must be 5MB or smaller.',
        ]);
    }

    protected function completeCodDetailsUpload(Customer $customer, Request $request, array $data): IdSubmission
    {
        $idDocPath = null;
        if ($request->hasFile('cod_id_document')) {
            $file = $request->file('cod_id_document');
            $filename = 'id-submissions/'.$customer->id.'/cod-id-'.time().'.'.$file->getClientOriginalExtension();
            $idDocPath = Storage::disk('s3')->putFileAs('', $file, $filename);
        }

        if (! $idDocPath) {
            throw ValidationException::withMessages([
                'cod_id_document' => 'Your COD ID document could not be uploaded to storage. Please upload the image again or use a smaller file.',
            ]);
        }

        $selfiePath = null;
        if ($request->hasFile('cod_selfie')) {
            $file = $request->file('cod_selfie');
            $filename = 'id-submissions/'.$customer->id.'/cod-selfie-'.time().'.'.$file->getClientOriginalExtension();
            $selfiePath = Storage::disk('s3')->putFileAs('', $file, $filename);
        }

        $submission = IdSubmission::create([
            'customer_id' => $customer->id,
            'order_id' => null,
            'id_type' => $data['cod_id_type'],
            'id_number' => $data['cod_id_number'],
            'full_name' => $data['cod_full_name'],
            'date_of_birth' => $data['cod_date_of_birth'],
            'id_document_path' => $idDocPath,
            'selfie_path' => $selfiePath,
            'status' => 'pending',
        ]);

        $customer->forceFill([
            'id_verification_status' => 'pending_review',
            'cod_details_completed_at' => now(),
        ])->save();

        return $submission;
    }
}
