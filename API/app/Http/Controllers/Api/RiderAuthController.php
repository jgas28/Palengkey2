<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/** Rider app (palengkey-rider-mobile) login — same response shape as the old backend. */
class RiderAuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $rider = Rider::where('email', $credentials['email'])->first();

        if (! $rider || ! $rider->password || ! Hash::check($credentials['password'], $rider->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        if (! $rider->is_active) {
            return response()->json(['success' => false, 'message' => 'Your rider account is inactive. Please contact your market admin.'], 403);
        }

        $token = $rider->createToken('rider-app', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => $rider,
        ]);
    }

    public function logout(Request $request)
    {
        $rider = $request->user();

        if ($rider instanceof Rider) {
            $rider->currentAccessToken()?->delete();
        }

        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    }
}
