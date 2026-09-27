<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MarketingBlastMail;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailBlastController extends Controller
{
    public function stats()
    {
        $customers = $this->validEmailCustomers();
        $optedIn = $customers->filter(fn (Customer $c) => $this->allowsPromotionalEmail($c));

        return response()->json([
            'customers_with_email' => $customers->count(),
            'email_opted_in' => $optedIn->count(),
        ]);
    }

    public function send(Request $request)
    {
        $data = $request->validate([
            'audience' => 'required|in:opted_in,all_with_email',
            'subject' => 'required|string|max:150',
            'body' => 'required|string|max:10000',
        ]);

        $customers = $this->validEmailCustomers();
        if ($data['audience'] === 'opted_in') {
            $customers = $customers->filter(fn (Customer $c) => $this->allowsPromotionalEmail($c));
        }

        $emails = $customers->pluck('email')->unique()->values();

        if ($emails->isEmpty()) {
            return response()->json(['message' => 'No valid recipients found for the selected audience.'], 422);
        }

        $sent = 0;
        $failed = 0;
        foreach ($emails as $email) {
            try {
                Mail::to($email)->send(new MarketingBlastMail($data['subject'], $data['body']));
                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                Log::warning('Marketing email blast failed for one recipient.', ['email' => $email, 'error' => $e->getMessage()]);
            }
        }

        Log::info('Marketing email blast requested.', [
            'admin_id' => $request->user()->id,
            'audience' => $data['audience'],
            'sent' => $sent,
            'failed' => $failed,
        ]);

        return response()->json([
            'message' => "Email blast sent to {$sent} recipient".($sent === 1 ? '' : 's').($failed > 0 ? ", {$failed} failed." : '.'),
        ]);
    }

    private function validEmailCustomers(): Collection
    {
        return Customer::query()->whereNotNull('email')->get(['id', 'email', 'notification_preferences']);
    }

    private function allowsPromotionalEmail(Customer $customer): bool
    {
        $preferences = array_merge($this->defaultNotificationPreferences(), $customer->notification_preferences ?? []);

        return (bool) ($preferences['promotions'] ?? false) && (bool) ($preferences['email_notifications'] ?? false);
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
