<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Setting;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * "Close market": while closed, every item in the market is Order Later only
 * and deliveries start on the reopen date. It reopens by itself at the opening
 * time on the chosen date, or early via reopen().
 *
 * Market admins act on their own market; super admins pass market_id.
 */
class MarketClosureController extends Controller
{
    private const MAX_DAYS_CLOSED = 90;

    public function show(Request $request)
    {
        return response()->json($this->state($this->resolveMarket($request)));
    }

    public function close(Request $request)
    {
        $market = $this->resolveMarket($request);
        $this->ensureMigrated();

        $timezone = $market->cutoff_timezone ?: 'Asia/Manila';
        $today = now($timezone)->toDateString();
        $latest = now($timezone)->addDays(self::MAX_DAYS_CLOSED)->toDateString();

        $data = $request->validate([
            'reopen_date' => ['required', 'date_format:Y-m-d', 'after:'.$today, 'before_or_equal:'.$latest],
            'closed_reason' => ['nullable', 'string', 'max:160'],
        ], [
            'reopen_date.after' => 'Pick a reopen date after today.',
            'reopen_date.before_or_equal' => 'A market can be closed for at most '.self::MAX_DAYS_CLOSED.' days at a time.',
        ]);

        $opening = Setting::get('order_operational_start_time', '05:00') ?: '05:00';
        $closedUntil = Carbon::parse("{$data['reopen_date']} {$opening}", $timezone)
            ->timezone(config('app.timezone'));

        $market->update([
            'closed_until' => $closedUntil,
            'closed_reason' => $data['closed_reason'] ?? null,
        ]);

        AuditLogger::custom('market_closed', [
            'market_id' => $market->id,
            'closed_until' => $closedUntil->toDateTimeString(),
            'reason' => $data['closed_reason'] ?? null,
        ]);

        return response()->json([
            'message' => "{$market->name} is closed. All items are Order Later only until "
                .$closedUntil->copy()->timezone($timezone)->format('M j, g:i A').'.',
            ...$this->state($market),
        ]);
    }

    public function reopen(Request $request)
    {
        $market = $this->resolveMarket($request);
        $this->ensureMigrated();

        $market->update(['closed_until' => null, 'closed_reason' => null]);

        AuditLogger::custom('market_reopened', ['market_id' => $market->id]);

        return response()->json([
            'message' => "{$market->name} is open again.",
            ...$this->state($market),
        ]);
    }

    private function resolveMarket(Request $request): Market
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            $marketId = (int) $request->input('market_id');
            abort_unless($marketId > 0, 422, 'Choose a market.');

            return Market::findOrFail($marketId);
        }

        // Market admins: only their own market, whatever the request says.
        abort_unless($user->market_id, 403, 'Your account is not assigned to a market.');

        return Market::findOrFail($user->market_id);
    }

    private function ensureMigrated(): void
    {
        abort_unless(Market::supportsClosure(), 422, 'Closing markets needs a database update first (php artisan migrate).');
    }

    private function state(Market $market): array
    {
        $timezone = $market->cutoff_timezone ?: 'Asia/Manila';

        return [
            'market_id' => $market->id,
            'market_name' => $market->name,
            'min_reopen_date' => now($timezone)->addDay()->toDateString(),
            'max_reopen_date' => now($timezone)->addDays(self::MAX_DAYS_CLOSED)->toDateString(),
            ...$market->closurePayload(),
        ];
    }
}
