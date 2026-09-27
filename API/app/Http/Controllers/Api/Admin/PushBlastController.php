<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class PushBlastController extends Controller
{
    public function stats()
    {
        $customers = $this->customersWithDeviceTokens();
        $optedIn = $customers->filter(fn (Customer $c) => $this->allowsPush($c));

        return response()->json([
            'customers_with_device' => $customers->count(),
            'push_opted_in' => $optedIn->count(),
        ]);
    }

    public function send(Request $request, PushNotificationService $push)
    {
        $data = $request->validate([
            'audience' => 'required|in:opted_in,all_with_device',
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:255',
            'url' => 'nullable|string|max:255',
        ]);

        $customers = $this->customersWithDeviceTokens();
        if ($data['audience'] === 'opted_in') {
            $customers = $customers->filter(fn (Customer $c) => $this->allowsPush($c));
        }

        $tokens = $customers
            ->flatMap(fn (Customer $c) => $c->devices->pluck('fcm_token'))
            ->filter()->unique()->values()->all();

        if (empty($tokens)) {
            return response()->json(['message' => 'No valid recipients found for the selected audience.'], 422);
        }

        $result = $push->sendToTokens($tokens, $data['title'], $data['body'], array_filter(['url' => $data['url'] ?? null]));

        Log::info('Marketing push blast requested.', [
            'admin_id' => $request->user()->id,
            'audience' => $data['audience'],
            'recipient_count' => count($tokens),
            'sent' => $result['sent'],
            'failed' => $result['failed'],
        ]);

        return response()->json([
            'message' => "Push blast sent to {$result['sent']} device".($result['sent'] === 1 ? '' : 's').($result['failed'] > 0 ? ", {$result['failed']} failed." : '.'),
        ]);
    }

    private function customersWithDeviceTokens(): Collection
    {
        return Customer::query()
            ->with(['devices' => fn ($query) => $query->whereNotNull('fcm_token')])
            ->whereHas('devices', fn ($query) => $query->whereNotNull('fcm_token'))
            ->get(['id', 'notification_preferences']);
    }

    private function allowsPush(Customer $customer): bool
    {
        $preferences = array_merge($this->defaultNotificationPreferences(), $customer->notification_preferences ?? []);

        return (bool) ($preferences['push_notifications'] ?? false);
    }

    private function defaultNotificationPreferences(): array
    {
        return [
            'order_updates' => true,
            'promotions' => true,
            'email_notifications' => true,
            'sms_notifications' => false,
            'push_notifications' => true,
            'newsletter' => true,
        ];
    }
}
