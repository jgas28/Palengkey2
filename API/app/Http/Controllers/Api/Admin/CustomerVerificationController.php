<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomerRegistrationApprovedMail;
use App\Mail\CustomerRegistrationRejectedMail;
use App\Models\Customer;
use App\Models\CustomerVerification;
use App\Services\CustomerPushNotifier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class CustomerVerificationController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');
        $perPage = max(1, min((int) $request->query('per_page', 20), 100));
        $search = trim((string) $request->query('search', ''));

        $entries = $this->registrationApprovalIndexQuery()
            ->when($search !== '', function (Builder $query) use ($search) {
                $like = '%'.$search.'%';
                $query->where(function (Builder $q) use ($like) {
                    $q->where('fname', 'like', $like)
                        ->orWhere('lname', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhereHas('latestVerification', function (Builder $v) use ($like) {
                            $v->where('full_name', 'like', $like)
                                ->orWhere('id_number', 'like', $like)
                                ->orWhere('id_type', 'like', $like);
                        });
                });
            });

        $this->applyStatusFilter($entries, $status);

        $entries = $entries->orderByDesc('created_at')->paginate($perPage);

        $counts = [
            'pending' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'pending')->count(),
            'approved' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'approved')->count(),
            'rejected' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'rejected')->count(),
            'all' => $this->registrationApprovalIndexQuery()->count(),
        ];

        return response()->json(['entries' => $entries, 'counts' => $counts]);
    }

    public function show($id)
    {
        $verification = CustomerVerification::with('customer', 'reviewedByUser')->findOrFail($id);
        $isSkipped = $verification->id_type === 'skipped';
        $disk = $this->disk();

        $idDocUrl = ! $isSkipped && $verification->id_document_path ? $this->temporaryUrl($disk, $verification->id_document_path) : null;
        $selfieUrl = ! $isSkipped && $verification->selfie_path ? $this->temporaryUrl($disk, $verification->selfie_path) : null;

        return response()->json([
            'id' => $verification->id,
            'customer_id' => $verification->customer_id,
            'customer' => [
                'id' => $verification->customer->id,
                'name' => $verification->customer->fname.' '.$verification->customer->lname,
                'email' => $verification->customer->email,
                'phone' => $verification->customer->phone,
            ],
            'id_type' => $verification->id_type,
            'id_number' => $verification->id_number,
            'full_name' => $verification->full_name,
            'date_of_birth' => $verification->date_of_birth,
            'id_document_url' => $idDocUrl,
            'selfie_url' => $selfieUrl,
            'is_skipped' => $isSkipped,
            'status' => $verification->status,
            'review_notes' => $verification->review_notes,
            'reviewed_at' => $verification->reviewed_at,
            'reviewed_by_user' => $verification->reviewedByUser ? [
                'id' => $verification->reviewedByUser->id,
                'name' => $verification->reviewedByUser->name,
            ] : null,
            'submitted_at' => $verification->created_at,
            'customer_verification_status' => $verification->customer->verification_status,
            'customer_id_verification_status' => $verification->customer->id_verification_status,
            'can_review' => $verification->status === 'pending'
                || in_array($verification->customer->verification_status, ['pending', 'pending_admin_approval'], true)
                || $verification->customer->id_verification_status === 'pending_review',
        ]);
    }

    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        $verification = CustomerVerification::findOrFail($id);
        $customer = $verification->customer;
        $reviewNotes = trim((string) $request->input('notes', '')) ?: null;

        $verification->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'review_notes' => $reviewNotes,
        ]);

        $customer->update([
            'verification_status' => 'approved',
            'id_verification_status' => $verification->id_type === 'skipped' ? 'skipped' : 'approved',
            'verified_at' => now(),
            'verified_by' => $admin->id,
            'email_verified_at' => now(),
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_last_sent_at' => null,
            'otp_attempts' => 0,
        ]);

        $emailSent = $this->sendMail($customer, fn () => new CustomerRegistrationApprovedMail($customer->fresh(), $reviewNotes));

        CustomerPushNotifier::send($customer, 'Account approved', "You're verified! You can now order from Palengkey.", ['url' => '/profile']);

        return response()->json([
            'message' => $emailSent
                ? 'Verification approved successfully. Approval email sent to customer.'
                : 'Verification approved successfully, but no approval email was sent.',
            'verification' => $verification->fresh(),
        ]);
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $request->validate(['reason' => 'required|string|min:5|max:500']);

        $verification = CustomerVerification::findOrFail($id);
        $customer = $verification->customer;
        $reason = trim((string) $request->input('reason'));

        $verification->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'review_notes' => $reason,
        ]);

        // If the account is already approved, rejecting ID docs shouldn't lock the customer out.
        $customer->update([
            'verification_status' => $customer->verification_status === 'approved' ? 'approved' : 'rejected',
            'id_verification_status' => 'rejected',
            'rejected_at' => now(),
            'verified_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        $emailSent = $this->sendMail($customer, fn () => new CustomerRegistrationRejectedMail($customer->fresh(), $reason));

        CustomerPushNotifier::send($customer, 'Account verification update', $reason, ['url' => '/verify-id']);

        return response()->json([
            'message' => $emailSent
                ? 'Verification rejected. Rejection email sent to customer.'
                : 'Verification rejected, but no rejection email was sent.',
            'verification' => $verification->fresh(),
        ]);
    }

    /** For a customer stuck pending with no CustomerVerification record at all. */
    public function approveAccount(Request $request, $customerId)
    {
        $admin = $request->user();
        $customer = Customer::findOrFail($customerId);
        $reviewNotes = trim((string) $request->input('notes', '')) ?: null;

        $customer->update([
            'verification_status' => 'approved',
            'id_verification_status' => $customer->id_verification_status === 'pending_review' ? $customer->id_verification_status : 'skipped',
            'identity_verification_skipped_at' => $customer->identity_verification_skipped_at ?: now(),
            'verified_at' => now(),
            'verified_by' => $admin->id,
            'email_verified_at' => $customer->email_verified_at ?: now(),
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_last_sent_at' => null,
            'otp_attempts' => 0,
        ]);

        $emailSent = $this->sendMail($customer, fn () => new CustomerRegistrationApprovedMail($customer->fresh(), $reviewNotes));

        return response()->json([
            'message' => $emailSent
                ? 'Account approved successfully. Approval email sent to customer.'
                : 'Account approved successfully, but no approval email was sent.',
        ]);
    }

    public function rejectAccount(Request $request, $customerId)
    {
        $admin = $request->user();
        $request->validate(['reason' => 'required|string|min:5|max:500']);

        $customer = Customer::findOrFail($customerId);
        $reason = trim((string) $request->input('reason'));

        $customer->update([
            'verification_status' => 'rejected',
            'rejected_at' => now(),
            'verified_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        $emailSent = $this->sendMail($customer, fn () => new CustomerRegistrationRejectedMail($customer->fresh(), $reason));

        return response()->json([
            'message' => $emailSent
                ? 'Account rejected successfully. Rejection email sent to customer.'
                : 'Account rejected successfully, but no rejection email was sent.',
        ]);
    }

    public function stats()
    {
        return response()->json([
            'pending' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'pending')->count(),
            'approved' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'approved')->count(),
            'rejected' => $this->applyStatusFilter($this->registrationApprovalIndexQuery(), 'rejected')->count(),
            'total' => $this->registrationApprovalIndexQuery()->count(),
        ]);
    }

    public function unverifiedCustomers(Request $request)
    {
        $customers = Customer::where('verification_status', '!=', 'approved')
            ->orWhereNull('verification_status')
            ->orderByDesc('created_at')
            ->paginate((int) $request->query('per_page', 20));

        $customers->getCollection()->transform(fn (Customer $c) => [
            'id' => $c->id,
            'name' => $c->fname.' '.$c->lname,
            'email' => $c->email,
            'phone' => $c->phone,
            'verification_status' => $c->verification_status ?? 'pending',
            'created_at' => $c->created_at,
            'has_pending_verification' => $c->verifications()->where('status', 'pending')->exists(),
        ]);

        return response()->json($customers);
    }

    private function registrationApprovalIndexQuery(): Builder
    {
        return Customer::query()
            ->with(['latestVerification.reviewedByUser'])
            ->where(function (Builder $query) {
                $query->whereHas('latestVerification')
                    ->orWhereIn('verification_status', ['pending', 'pending_admin_approval'])
                    ->orWhere('id_verification_status', 'pending_review');
            });
    }

    private function applyStatusFilter(Builder $query, string $status): Builder
    {
        return match ($status) {
            'pending' => $query->pendingVerification(),
            'approved' => $query->where('verification_status', 'approved')
                ->whereHas('latestVerification', fn (Builder $v) => $v->where('status', 'approved'))
                ->where(fn (Builder $q) => $q->whereIn('id_verification_status', ['approved', 'skipped', 'not_submitted'])->orWhereNull('id_verification_status')),
            'rejected' => $query->where(fn (Builder $q) => $q->where('verification_status', 'rejected')
                ->orWhere('id_verification_status', 'rejected')
                ->orWhereHas('latestVerification', fn (Builder $v) => $v->where('status', 'rejected'))),
            default => $query,
        };
    }

    private function sendMail(Customer $customer, \Closure $mailable): bool
    {
        if (blank($customer->email)) {
            return false;
        }

        try {
            Mail::to($customer->email)->send($mailable());

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to send customer verification email.', ['customer_id' => $customer->id, 'error' => $e->getMessage()]);

            return false;
        }
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
