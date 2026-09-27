<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\PhoneNumber;
use App\Services\SemaphoreSmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SmsBlastController extends Controller
{
    private const SMS_CHARACTER_LIMIT = 160;

    public function stats()
    {
        $customers = $this->validPhoneCustomers();
        $optedIn = $customers->filter(fn (Customer $customer) => $this->allowsPromotionalSms($customer));

        return response()->json([
            'customers_with_phone' => $customers->count(),
            'sms_opted_in' => $optedIn->count(),
            'verified_with_phone' => $customers->filter(fn (Customer $c) => $c->verification_status === 'approved')->count(),
        ]);
    }

    public function send(Request $request, SemaphoreSmsService $sms)
    {
        $data = $request->validate([
            'category' => 'required|in:promo,advertisement,announcement',
            'audience' => 'required|in:opted_in,verified,all_with_phone,manual',
            'numbers' => 'required_if:audience,manual|nullable|string|max:50000',
            'message' => 'required|string|min:3|max:'.self::SMS_CHARACTER_LIMIT,
            'sendername' => 'nullable|string|max:11',
        ], ['message.max' => 'SMS messages are limited to '.self::SMS_CHARACTER_LIMIT.' characters.']);

        [$numbers, $invalidNumbers] = $this->resolveRecipients($data['audience'], (string) ($data['numbers'] ?? ''));

        if (! empty($invalidNumbers)) {
            return response()->json([
                'message' => 'Invalid phone number(s): '.implode(', ', array_slice($invalidNumbers, 0, 10)).'. Use +63 followed by 10 digits.',
            ], 422);
        }

        if (empty($numbers)) {
            return response()->json(['message' => 'No valid recipients found for the selected audience.'], 422);
        }

        $result = $sms->sendMessage($numbers, $data['message'], $data['sendername'] ?? null);

        Log::info('Marketing SMS blast requested.', [
            'admin_id' => $request->user()->id,
            'category' => $data['category'],
            'audience' => $data['audience'],
            'recipient_count' => count($numbers),
            'successful' => $result['successful'] ?? false,
        ]);

        if (! ($result['successful'] ?? false)) {
            return response()->json(['message' => $result['message'] ?? 'SMS blast failed.'], 422);
        }

        return response()->json(['message' => 'SMS blast queued for '.count($numbers).' recipient'.(count($numbers) === 1 ? '' : 's').'.']);
    }

    private function resolveRecipients(string $audience, string $manualNumbers): array
    {
        if ($audience === 'manual') {
            $parsed = PhoneNumber::splitMany($manualNumbers);

            return [$parsed['valid'], $parsed['invalid']];
        }

        $customers = $this->validPhoneCustomers();

        $customers = match ($audience) {
            'opted_in' => $customers->filter(fn (Customer $c) => $this->allowsPromotionalSms($c)),
            'verified' => $customers->filter(fn (Customer $c) => $c->verification_status === 'approved'),
            default => $customers,
        };

        $numbers = $customers
            ->map(fn (Customer $c) => PhoneNumber::normalizePhilippineMobile($c->phone))
            ->filter()->unique()->values()->all();

        return [$numbers, []];
    }

    private function validPhoneCustomers(): Collection
    {
        return Customer::query()
            ->whereNotNull('phone')
            ->get(['id', 'phone', 'verification_status', 'notification_preferences'])
            ->filter(fn (Customer $c) => PhoneNumber::isValidPhilippineMobile($c->phone))
            ->values();
    }

    private function allowsPromotionalSms(Customer $customer): bool
    {
        $preferences = array_merge($this->defaultNotificationPreferences(), $customer->notification_preferences ?? []);

        return (bool) ($preferences['promotions'] ?? false) && (bool) ($preferences['sms_notifications'] ?? false);
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
