<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PopupAd;

class PopupAdController extends Controller
{
    public function index()
    {
        $popupAds = PopupAd::with('voucher')
            ->activeForDisplay()
            ->get()
            ->map(fn (PopupAd $ad) => [
                'id' => $ad->id,
                'type' => $ad->type,
                'type_label' => $ad->type_label,
                'title' => $ad->title,
                'subtitle' => $ad->subtitle,
                'body' => $ad->body,
                'badge_text' => $ad->badge_text,
                'cta_label' => $ad->cta_label,
                'cta_url' => $ad->cta_url,
                'image_url' => $ad->image_url,
                'updated_at' => $ad->updated_at?->toIso8601String(),
                'voucher' => $ad->voucher ? [
                    'id' => $ad->voucher->id,
                    'code' => $ad->voucher->code,
                    'description' => $ad->voucher->description,
                ] : null,
            ]);

        return response()->json(['data' => $popupAds]);
    }
}
