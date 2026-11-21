<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountId;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** Admin review of customers' PWD / Senior Citizen IDs. */
class DiscountIdController extends Controller
{
    private const SIDES = ['front' => 'front_path', 'back' => 'back_path', 'selfie' => 'selfie_path'];

    public function index(Request $request)
    {
        $status = (string) $request->query('status', 'pending');
        $search = trim((string) $request->query('search', ''));

        $query = DiscountId::with('customer:id,fname,lname,email,phone')
            ->latest('id')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $like = '%'.addcslashes($search, '%_\\').'%';
                $q->where(fn ($w) => $w->where('id_number', 'like', $like)
                    ->orWhere('full_name', 'like', $like)
                    ->orWhereHas('customer', fn ($c) => $c->where('email', 'like', $like)
                        ->orWhere('fname', 'like', $like)
                        ->orWhere('lname', 'like', $like)
                        ->orWhere('phone', 'like', $like)));
            });

        $counts = DiscountId::select('status', DB::raw('COUNT(*) as total'))->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'discount_ids' => $query->paginate(20)->through(fn (DiscountId $d) => $this->present($d)),
            'counts' => [
                'pending' => (int) ($counts['pending'] ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'all' => (int) $counts->sum(),
            ],
        ]);
    }

    public function show(DiscountId $discountId)
    {
        $discountId->load(['customer:id,fname,lname,email,phone', 'reviewer:id,name']);

        return response()->json($this->present($discountId) + [
            'files' => array_keys(array_filter(self::SIDES, fn ($column) => (bool) $discountId->{$column})),
            'reviewed_by' => $discountId->reviewer?->name,
            'review_notes' => $discountId->review_notes,
        ]);
    }

    /** Streams one ID photo. IDs are stored privately, so admins see them only through here. */
    public function file(DiscountId $discountId, string $side)
    {
        $column = self::SIDES[$side] ?? null;
        $path = $column ? $discountId->{$column} : null;

        if (! $path || ! Storage::disk($discountId->disk)->exists($path)) {
            abort(404);
        }

        AuditLogger::custom('discount_id_viewed', ['discount_id' => $discountId->id, 'side' => $side]);

        return Storage::disk($discountId->disk)->response($path, null, [
            'Cache-Control' => 'private, no-store',
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function approve(Request $request, DiscountId $discountId)
    {
        $data = $request->validate(['notes' => 'nullable|string|max:500']);

        return $this->review($request, $discountId, 'approved', $data['notes'] ?? null);
    }

    public function reject(Request $request, DiscountId $discountId)
    {
        $data = $request->validate(['reason' => 'required|string|min:5|max:500']);

        return $this->review($request, $discountId, 'rejected', $data['reason']);
    }

    private function review(Request $request, DiscountId $discountId, string $status, ?string $notes)
    {
        $updated = DiscountId::whereKey($discountId->id)->where('status', 'pending')->update([
            'status' => $status,
            'review_notes' => $notes !== null ? strip_tags(trim($notes)) : null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($updated !== 1) {
            return response()->json(['message' => 'This ID has already been reviewed.'], 422);
        }

        AuditLogger::custom('discount_id_'.$status, [
            'discount_id' => $discountId->id,
            'customer_id' => $discountId->customer_id,
            'type' => $discountId->type,
        ]);

        return response()->json([
            'message' => $status === 'approved' ? 'ID approved.' : 'ID rejected.',
            'discount_id' => $this->present($discountId->fresh(['customer:id,fname,lname,email,phone'])),
        ]);
    }

    private function present(DiscountId $discountId): array
    {
        $customer = $discountId->customer;

        return [
            'id' => $discountId->id,
            'type' => $discountId->type,
            'type_label' => $discountId->typeLabel(),
            'id_number' => $discountId->id_number,
            'full_name' => $discountId->full_name,
            'status' => $discountId->status,
            'submitted_at' => $discountId->created_at,
            'reviewed_at' => $discountId->reviewed_at,
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => trim($customer->fname.' '.$customer->lname),
                'email' => $customer->email,
                'phone' => $customer->phone,
            ] : null,
        ];
    }
}
