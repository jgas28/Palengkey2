<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerVerification;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomerVerificationController extends Controller
{
    public function submit(Request $request)
    {
        $customer = $request->user();

        $validated = $request->validate([
            'id_type' => 'required|in:nbi,passport,drivers_license,sss,tin,voters_id,postal_id,umid',
            'id_number' => 'required|string|min:5|max:50',
            'full_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'id_document' => 'required|file|mimes:jpg,jpeg,png,webp,heic,heif,pdf|max:5120',
            'selfie_with_id' => 'nullable|file|mimes:jpg,jpeg,png,webp,heic,heif|max:5120',
        ]);

        try {
            $idDocPath = $this->uploadFile($request->file('id_document'), 'customer-verifications/id-documents', $customer->id);

            $selfiePath = null;
            if ($request->hasFile('selfie_with_id')) {
                $selfiePath = $this->uploadFile($request->file('selfie_with_id'), 'customer-verifications/selfies', $customer->id);
            }

            $verification = CustomerVerification::updateOrCreate(
                ['customer_id' => $customer->id, 'status' => 'pending'],
                [
                    'id_type' => $validated['id_type'],
                    'id_number' => $validated['id_number'],
                    'full_name' => $validated['full_name'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'id_document_path' => $idDocPath,
                    'selfie_path' => $selfiePath,
                    'status' => 'pending',
                ]
            );

            // Only update id_verification_status — never reset verification_status.
            // An already-approved account can keep shopping while ID docs are reviewed.
            $customer->update([
                'id_verification_status' => 'pending_review',
                'rejection_reason' => null,
                'rejected_at' => null,
            ]);

            return response()->json([
                'message' => 'Verification documents submitted successfully. Please wait for admin review.',
                'verification' => $verification,
                'verification_status' => $customer->verification_status,
                'id_verification_status' => 'pending_review',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload verification documents',
                'error' => config('app.debug') ? $e->getMessage() : 'Please try again',
            ], 500);
        }
    }

    public function skip(Request $request)
    {
        $customer = $request->user();

        // Don't let an approved account with an already-submitted ID accidentally
        // create a duplicate "skipped" verification record.
        if ($customer->verification_status === 'approved' && $customer->id_verification_status !== 'not_submitted') {
            return response()->json(['message' => 'ID verification has already been submitted or is not required.'], 422);
        }

        $fullName = trim(implode(' ', array_filter([$customer->fname, $customer->mname, $customer->lname])));

        $verification = $customer->verifications()->where('status', 'pending')->latest()->first();

        if (! $verification) {
            $verification = CustomerVerification::create([
                'customer_id' => $customer->id,
                'id_type' => 'skipped',
                'id_number' => 'Skipped during registration',
                'full_name' => $fullName ?: $customer->email,
                'date_of_birth' => null,
                'id_document_path' => '',
                'selfie_path' => null,
                'status' => 'pending',
                'review_notes' => 'Customer skipped ID upload during registration.',
            ]);
        }

        $customerUpdate = [
            'id_verification_status' => 'skipped',
            'identity_verification_skipped_at' => now(),
            'cod_details_completed_at' => null,
            'rejection_reason' => null,
            'rejected_at' => null,
            'verified_by' => null,
        ];

        if ($customer->verification_status !== 'approved') {
            $customerUpdate['verification_status'] = 'pending_admin_approval';
        }

        $customer->update($customerUpdate);

        return response()->json([
            'message' => 'Registration submitted. Your account is now pending admin approval.',
            'verification_status' => $customer->fresh()->verification_status,
            'id_verification_status' => 'skipped',
            'verification' => $verification,
        ], 201);
    }

    public function status(Request $request)
    {
        $customer = $request->user();
        $verification = $customer->latestVerification;
        $latestIdSubmission = $customer->idSubmissions()->latest()->first();

        return response()->json([
            'verification_status' => $customer->verification_status,
            'id_verification_status' => $customer->id_verification_status,
            'requires_cod_verification' => $customer->requiresCodApproval(),
            'cod_verification_pending' => $customer->hasPendingCodApproval(),
            'needs_cod_details' => $customer->needsCodDetailsCompletion(),
            'verified_at' => $customer->verified_at,
            'rejected_at' => $customer->rejected_at,
            'rejection_reason' => $customer->rejection_reason,
            'latest_submission' => $verification ? [
                'id' => $verification->id,
                'id_type' => $verification->id_type,
                'status' => $verification->status,
                'reviewed_at' => $verification->reviewed_at,
                'review_notes' => $verification->review_notes,
                'submitted_at' => $verification->created_at,
            ] : null,
            'latest_id_submission' => $latestIdSubmission ? [
                'status' => $latestIdSubmission->status,
                'review_notes' => $latestIdSubmission->review_notes,
                'reviewed_at' => $latestIdSubmission->reviewed_at,
            ] : null,
        ]);
    }

    /** S3 isn't configured until AWS creds are added — fall back to the local public disk. */
    private function uploadFile(UploadedFile $file, string $path, int $customerId): string
    {
        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($path.'/'.$customerId, $filename, $disk);
    }
}
