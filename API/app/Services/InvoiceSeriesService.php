<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InvoiceSeriesService
{
    /** Format: yyyymmdd-00000(marketid)-000000(running series, resets daily per market). */
    public static function generateSeriesNumber($marketId, $date = null): string
    {
        $date = $date ? Carbon::parse($date) : Carbon::now();
        $dateString = $date->format('Ymd');
        $marketIdPadded = str_pad((string) $marketId, 5, '0', STR_PAD_LEFT);
        $runningNumber = self::getNextRunningNumber($marketId, $date);
        $runningNumberPadded = str_pad((string) $runningNumber, 6, '0', STR_PAD_LEFT);

        return "{$dateString}-{$marketIdPadded}-{$runningNumberPadded}";
    }

    private static function getNextRunningNumber($marketId, $date = null): int
    {
        $date = $date ? Carbon::parse($date) : Carbon::now();

        $lastSeries = DB::table('invoice_series')
            ->where('market_id', $marketId)
            ->where('date', $date->format('Y-m-d'))
            ->max('running_number');

        return ($lastSeries ?? 0) + 1;
    }

    public static function recordSeriesNumber($marketId, $runningNumber, $orderId = null, $date = null): void
    {
        $date = $date ? Carbon::parse($date) : Carbon::now();

        DB::table('invoice_series')->insertOrIgnore([
            'market_id' => $marketId,
            'date' => $date->format('Y-m-d'),
            'running_number' => $runningNumber,
            'order_id' => $orderId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
