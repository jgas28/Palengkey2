<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomerIdSubmissionApprovedMail;
use App\Mail\CustomerIdSubmissionRejectedMail;
use App\Models\IdSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class IdSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');
        $search = trim((string) $request->query('search', ''));
        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        $query = IdSubmission::with(['customer', 'order'])
            ->orderByDesc('created_at')
            ->when($search !== '', function ($q) use ($search) {
                $like = '%'.$search.'%';
                $q->where(function ($fq) use ($like) {
                    $fq->where('id_number', 'like', $like)
                        ->orWhere('full_name', 'like', $like)
                        ->orWhere('id_type', 'like', $like)
                        ->orWhereHas('customer', fn ($cq) => $cq->where('fname', 'like', $like)
                            ->orWhere('lname', 'like', $like)
                            ->orWhere('email', 'like', $like)
                            ->orWhere('phone', 'like', $like))
                        ->orWhereHas('order', fn ($oq) => $oq->where('order_number', 'like', $like));
                });
            });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $submissions = $query->paginate($perPage);

        $counts = [
            'pending' => IdSubmission::where('status', 'pending')->count(),
            'approved' => IdSubmission::where('status', 'approved')->count(),
            'rejected' => IdSubmission::where('status', 'rejected')->count(),
        ];

        return response()->json(['submissions' => $submissions, 'counts' => $counts]);
    }

    public function show($id)
    {
        $submission = IdSubmission::with(['customer', 'order', 'reviewedByUser'])->findOrFail($id);
        $disk = $this->disk();

        return response()->json([
            'id' => $submission->id,
            'customer' => $submission->customer ? [
                'id' => $submission->customer->id,
                'name' => $submission->customer->fname.' '.$submission->customer->lname,
                'email' => $submission->customer->email,
                'phone' => $submission->customer->phone,
            ] : null,
            'order' => $submission->order ? ['id' => $submission->order->id, 'order_number' => $submission->order->order_number] : null,
            'id_type' => $submission->id_type,
            'id_number' => $submission->id_number,
            'full_name' => $submission->full_name,
            'date_of_birth' => $submission->date_of_birth,
            'id_document_url' => $submission->id_document_path ? $this->temporaryUrl($disk, $submission->id_document_path) : null,
            'selfie_url' => $submission->selfie_path ? $this->temporaryUrl($disk, $submission->selfie_path) : null,
            'status' => $submission->status,
            'review_notes' => $submission->review_notes,
            'reviewed_at' => $submission->reviewed_at,
            'reviewed_by_user' => $submission->reviewedByUser ? ['id' => $submission->reviewedByUser->id, 'name' => $submission->reviewedByUser->name] : null,
            'submitted_at' => $submission->created_at,
        ]);
    }

    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        $submission = IdSubmission::with(['customer', 'order'])->findOrFail($id);

        if ($submission->status !== 'pending') {
            return response()->json(['message' => 'This submission has already been reviewed.'], 422);
        }

        $reviewNotes = trim((string) $request->input('notes', '')) ?: null;

        DB::transaction(function () use ($submission, $admin, $reviewNotes) {
            $submission->update([
                'status' => 'approved',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'review_notes' => $reviewNotes,
            ]);

            // Future COD checkouts skip the upload once this is approved.
            $submission->customer->forceFill(['id_verification_status' => 'approved'])->save();

            // Defensive: only relevant for orders created via the legacy pending_id_approval
            // flow — the current API checkout blocks before an order ever exists.
            if ($submission->order && $submission->order->status === 'pending_id_approval') {
                $submission->order->update(['status' => 'order_received']);
            }
        });

        $submission->refresh();

        $emailSent = false;
        if (filled($submission->customer->email)) {
            try {
                Mail::to($submission->customer->email)->send(
                    new CustomerIdSubmissionApprovedMail($submission->customer->fresh(), $submission->order, $reviewNotes)
                );
                $emailSent = true;
            } catch (\Throwable $e) {
                Log::error('Failed to send ID submission approved email', ['submission_id' => $submission->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => $emailSent ? 'ID submission approved. Customer notified.' : 'ID submission approved.',
            'submission' => $submission,
        ]);
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $request->validate(['reason' => 'required|string|min:5|max:500']);

        $submission = IdSubmission::with(['customer', 'order'])->findOrFail($id);

        if ($submission->status !== 'pending') {
            return response()->json(['message' => 'This submission has already been reviewed.'], 422);
        }

        DB::transaction(function () use ($submission, $admin, $request) {
            $submission->update([
                'status' => 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'review_notes' => $request->reason,
            ]);

            $submission->customer->forceFill([
                'id_verification_status' => 'rejected',
                'cod_details_completed_at' => null,
            ])->save();

            // Order (if any) stays put so the customer can resubmit.
        });

        $submission->refresh();

        $emailSent = false;
        if (filled($submission->customer->email)) {
            try {
                Mail::to($submission->customer->email)->send(
                    new CustomerIdSubmissionRejectedMail($submission->customer->fresh(), $submission->order, $request->reason)
                );
                $emailSent = true;
            } catch (\Throwable $e) {
                Log::error('Failed to send ID submission rejected email', ['submission_id' => $submission->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => $emailSent ? 'ID submission rejected. Customer notified to resubmit.' : 'ID submission rejected.',
            'submission' => $submission,
        ]);
    }

    private function temporaryUrl(string $disk, string $path): ?string
    {
        try {
            return $disk === 's3'
                ? Storage::disk($disk)->temporaryUrl($path, now()->addHours(24))
                : Storage::disk($disk)->url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }
}
