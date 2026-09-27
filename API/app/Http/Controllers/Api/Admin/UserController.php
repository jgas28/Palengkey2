<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private const ROLES = ['admin', 'marketing', 'finance', 'owner', 'super_admin'];

    public function index()
    {
        $users = User::whereIn('role', self::ROLES)->with('market')->latest()->get();

        return response()->json($users->map(fn (User $user) => $this->formatUser($user)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'fname' => 'required|string|max:100',
            'lname' => 'required|string|max:100',
            'mname' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:'.implode(',', self::ROLES),
            'market_id' => 'nullable|exists:markets,id',
        ]);

        if ($data['role'] === 'admin' && ! ($data['market_id'] ?? null)) {
            return response()->json(['message' => 'A market is required for the admin role.'], 422);
        }

        $user = User::create([
            'fname' => $data['fname'],
            'lname' => $data['lname'],
            'mname' => $data['mname'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'market_id' => $data['role'] === 'admin' ? $data['market_id'] : null,
        ]);

        AuditLogger::log('created', $user, $user->id, null, ['role' => $user->role]);

        return response()->json($this->formatUser($user->load('market')), 201);
    }

    public function update(Request $request, User $user)
    {
        if (! in_array($user->role, self::ROLES, true)) {
            abort(404);
        }

        $data = $request->validate([
            'fname' => 'sometimes|required|string|max:100',
            'lname' => 'sometimes|required|string|max:100',
            'mname' => 'nullable|string|max:100',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'role' => 'sometimes|required|in:'.implode(',', self::ROLES),
            'market_id' => 'nullable|exists:markets,id',
        ]);

        $role = $data['role'] ?? $user->role;
        if ($role === 'admin' && ! ($data['market_id'] ?? $user->market_id)) {
            return response()->json(['message' => 'A market is required for the admin role.'], 422);
        }
        if ($role !== 'admin') {
            $data['market_id'] = null;
        }

        $user->update($data);
        AuditLogger::log('updated', $user, $user->id, null, $data);

        return response()->json($this->formatUser($user->fresh('market')));
    }

    public function destroy(Request $request, User $user)
    {
        if (! in_array($user->role, self::ROLES, true)) {
            abort(404);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => "You can't remove your own account."], 422);
        }

        AuditLogger::log('deleted', $user, $user->id, $user->toArray(), null);
        $user->delete();

        return response()->json(['message' => 'Account removed.']);
    }

    public function resetPassword(Request $request, User $user)
    {
        if (! in_array($user->role, self::ROLES, true)) {
            abort(404);
        }

        $data = $request->validate(['password' => 'required|string|min:8']);
        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password reset.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'fname' => $user->fname,
            'lname' => $user->lname,
            'mname' => $user->mname,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'market_id' => $user->market_id,
            'market_name' => $user->market?->name,
        ];
    }
}
