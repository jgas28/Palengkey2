<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = AuditLog::with('user');

        if (! $user->isSuperAdmin()) {
            $query->whereHas('user', fn ($q) => $q->where('market_id', $user->market_id));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('model_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function users(Request $request)
    {
        $user = $request->user();
        $query = User::orderBy('fname')->orderBy('lname');

        if (! $user->isSuperAdmin()) {
            $query->where('market_id', $user->market_id);
        }

        return response()->json(
            $query->get(['id', 'fname', 'lname'])->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name]),
        );
    }
}
