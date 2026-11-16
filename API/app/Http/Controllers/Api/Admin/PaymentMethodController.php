<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\AuditLogger;
use App\Support\PaymentMethods;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admins and super admins: turn a payment method off during a PayMongo / wallet
 * / bank outage (e.g. GCash maintenance) and back on. Applies to every market.
 */
class PaymentMethodController extends Controller
{
    public function index()
    {
        return response()->json(['data' => PaymentMethods::status()]);
    }

    public function update(Request $request, string $method)
    {
        abort_unless(in_array($method, PaymentMethods::all(), true), 404);

        $data = $request->validate([
            'enabled' => 'required|boolean',
            // Shown to customers at checkout, e.g. "GCash maintenance".
            'reason' => [Rule::excludeIf($request->boolean('enabled')), 'nullable', 'string', 'max:120'],
        ]);

        $before = PaymentMethods::isEnabled($method);
        $reason = isset($data['reason']) ? trim(strip_tags($data['reason'])) ?: null : null;
        $by = $request->user()->name ?? $request->user()->email;

        if (! PaymentMethods::set($method, $data['enabled'], $reason, $by)) {
            return response()->json([
                'message' => 'Keep at least one payment method on, or customers cannot check out. Use maintenance mode to close ordering instead.',
            ], 422);
        }

        AuditLogger::custom($data['enabled'] ? 'payment_method_enabled' : 'payment_method_disabled', [
            'method' => $method,
            'was_enabled' => $before,
            'reason' => $reason,
        ]);

        $label = Order::paymentMethodLabel($method);

        return response()->json([
            'message' => $data['enabled']
                ? "{$label} is back on at checkout."
                : "{$label} is off. Customers can't choose it until you turn it back on.",
            'data' => PaymentMethods::status(),
        ]);
    }
}
