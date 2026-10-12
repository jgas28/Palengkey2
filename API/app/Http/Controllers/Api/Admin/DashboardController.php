<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerVerification;
use App\Models\IdSubmission;
use App\Models\Market;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $days = $this->periodDays($request);
        $marketId = $user->role === 'admin' ? $user->market_id : null;

        $payload = $user->role === 'admin'
            ? $this->marketDashboard($user)
            : $this->platformDashboard();

        return response()->json($payload + [
            'period_days' => $days,
            'overview' => $this->overview($days, $marketId),
        ]);
    }

    /** Paginated newest-first orders in the selected period, for the "Recent orders" table. */
    public function orders(Request $request)
    {
        $user = $request->user();
        $marketId = $user->role === 'admin' ? $user->market_id : null;
        [$from, $to] = $this->periodRange($this->periodDays($request));

        $page = Order::query()
            ->when($marketId, fn ($q) => $q->where('market_id', $marketId))
            ->whereBetween('created_at', [$from, $to])
            ->with(['customer:id,fname,lname,email', 'market:id,name'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(8, ['id', 'order_number', 'customer_id', 'market_id', 'contact_name', 'status', 'payment_status', 'total_amount', 'created_at']);

        $page->getCollection()->transform(fn (Order $order) => $this->formatLatestOrder($order));

        return response()->json($page);
    }

    /**
     * Headline KPIs for the last N days vs the N days before, for the
     * "Overview" cards (revenue, orders, customers, average order value).
     */
    /** 0 = today (since midnight, Manila — the default), 1 = last 24 hours, or 7/30/90 days. */
    private function periodDays(Request $request): int
    {
        $days = (int) $request->query('days', 0);

        return in_array($days, [0, 1, 7, 30, 90], true) ? $days : 0;
    }

    /** [from, to] for a period; "today" runs from Manila midnight to now. */
    private function periodRange(int $days): array
    {
        $start = $days === 0
            ? now('Asia/Manila')->startOfDay()->timezone(config('app.timezone'))
            : now()->subDays($days);

        return [$start, now()];
    }

    private function overview(int $days, ?int $marketId): array
    {
        [$start, $end] = $this->periodRange($days);
        // Compare with the same-length stretch just before (today → yesterday up to this time).
        $prevStart = $start->copy()->sub($start->diff($end));

        $orders = fn ($from, $to) => Order::query()
            ->when($marketId, fn ($q) => $q->where('market_id', $marketId))
            ->whereBetween('created_at', [$from, $to]);

        $period = function ($from, $to) use ($orders, $marketId) {
            $placed = (clone $orders($from, $to))->where('status', '!=', 'cancelled');
            $revenue = (float) (clone $orders($from, $to))->whereIn('status', ['delivered', 'completed'])->sum('total_amount');
            $count = (int) (clone $placed)->count();
            $customers = $marketId
                ? (int) (clone $placed)->distinct('customer_id')->count('customer_id')
                : (int) Customer::whereBetween('created_at', [$from, $to])->count();

            return [
                'revenue' => round($revenue, 2),
                'orders' => $count,
                'customers' => $customers,
                'average_order' => $count > 0 ? round((float) (clone $placed)->sum('total_amount') / $count, 2) : 0.0,
            ];
        };

        $current = $period($start, $end);
        $previous = $period($prevStart, $start);

        $change = fn ($now, $before) => $before > 0 ? round(($now - $before) / $before * 100, 1) : ($now > 0 ? 100.0 : 0.0);

        return collect($current)->map(fn ($value, $key) => [
            'value' => $value,
            'previous' => $previous[$key],
            'change' => $change($value, $previous[$key]),
        ])->all() + ['customers_label' => $marketId ? 'Customers ordering' : 'New customers'];
    }

    private function formatLatestOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'customer_name' => trim(($order->customer?->fname ?? '').' '.($order->customer?->lname ?? '')) ?: $order->contact_name,
            'customer_email' => $order->customer?->email,
            'market_name' => $order->market?->name,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'total_amount' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function marketDashboard(User $user): array
    {
        $orderStatuses = [
            'pending_payment', 'pending', 'pending_id_approval', 'order_received',
            'accepted', 'order_confirmed', 'preparing', 'preparing_items',
            'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled',
        ];

        $activeStatuses = [
            'pending_payment', 'pending', 'pending_id_approval', 'order_received',
            'accepted', 'order_confirmed', 'preparing', 'preparing_items',
            'ready', 'out_for_delivery',
        ];

        $marketOrders = Order::query()->where('market_id', $user->market_id);

        $statusCounts = (clone $marketOrders)
            ->whereIn('status', $orderStatuses)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $activeOrdersCount = (int) $statusCounts->only($activeStatuses)->sum();

        $statusBreakdown = [
            'order_received' => (int) ($statusCounts['order_received'] ?? 0),
            'order_confirmed' => (int) ($statusCounts['order_confirmed'] ?? 0),
            'preparing_items' => (int) ($statusCounts['preparing_items'] ?? 0),
            'out_for_delivery' => (int) ($statusCounts['out_for_delivery'] ?? 0),
        ];

        $todaySales = (clone $marketOrders)
            ->whereDate('created_at', now())
            ->where('status', 'delivered')
            ->sum('total_amount');

        $recentOrders = (clone $marketOrders)
            ->with('customer')
            ->whereIn('id', function ($query) use ($user) {
                $query->selectRaw('MAX(id)')
                    ->from('orders')
                    ->where('market_id', $user->market_id)
                    ->groupBy(DB::raw('DATE(created_at)'));
            })
            ->orderByDesc('created_at')
            ->take(8)
            ->get();

        return [
            'scope' => 'market',
            'active_orders_count' => $activeOrdersCount,
            'status_breakdown' => $statusBreakdown,
            'today_sales' => (float) $todaySales,
            'recent_orders' => $recentOrders,
        ];
    }

    private function platformDashboard(): array
    {
        $totalOrders = Order::count();

        $todaySales = Order::whereDate('created_at', now())->where('status', 'delivered')->sum('total_amount');
        $totalSales = Order::where('status', 'delivered')->sum('total_amount');

        $totalItemsSold = DB::table('order_items')->sum('quantity');

        // Only markets that are live (status 1) — not "coming soon" or deactivated ones.
        $salesPerMarket = Market::select(['id', 'name'])
            ->where('status', 1)
            ->withSum(['orders as total_sales' => fn ($q) => $q->where('status', 'delivered')], 'total_amount')
            ->orderByDesc('total_sales')
            ->take(5)
            ->get();

        $recentOrders = Order::with('market', 'customer')
            ->whereIn('id', function ($query) {
                $query->selectRaw('MAX(id)')->from('orders')->groupBy(DB::raw('DATE(created_at)'));
            })
            ->orderByDesc('created_at')
            ->take(10)
            ->get();

        return [
            'scope' => 'platform',
            'total_markets' => Market::where('status', 1)->count(), // active markets only
            'total_admins' => User::where('role', 'admin')->count(),
            'total_riders' => Rider::count(),
            'total_orders' => $totalOrders,
            'today_sales' => (float) $todaySales,
            'total_sales' => (float) $totalSales,
            'total_items_sold' => (int) $totalItemsSold,
            'total_customers' => Customer::count(),
            'verified_customers' => Customer::where('verification_status', 'approved')->count(),
            'pending_verifications' => Customer::pendingVerification()->count(),
            'pending_id_submissions' => IdSubmission::where('status', 'pending')->count(),
            'rejected_verifications' => CustomerVerification::where('status', 'rejected')->count(),
            'sales_per_market' => $salesPerMarket,
            'recent_orders' => $recentOrders,
        ];
    }
}
