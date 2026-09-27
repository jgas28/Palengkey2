<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MarketApiController extends Controller
{
    public function index(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        $cacheKey = "markets:list:{$lat}:{$lng}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($lat, $lng) {
            $query = Market::query()
                ->where('status', 1)
                ->select('id', 'name', 'address', 'latitude', 'longitude');

            if ($lat && $lng) {
                $query->selectRaw('
                    (6371 * acos(
                        cos(radians(?)) *
                        cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) *
                        sin(radians(latitude))
                    )) AS distance
                ', [$lat, $lng, $lat])->orderBy('distance');
            }

            $markets = $query->limit(50)->get();

            $activeMarkets = MarketPriceSnapshot::whereIn('market_id', $markets->pluck('id'))
                ->selectRaw('DISTINCT market_id')
                ->pluck('market_id')
                ->flip();

            return $markets->map(fn (Market $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'address' => $m->address,
                'latitude' => (float) $m->latitude,
                'longitude' => (float) $m->longitude,
                'has_items' => isset($activeMarkets[$m->id]),
                'distance' => isset($m->distance) ? round($m->distance, 2) : null,
            ]);
        });
    }
}
