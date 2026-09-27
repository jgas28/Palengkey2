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

        return $user->role === 'admin'
            ? response()->json($this->marketDashboard($user))
            : response()->json($this->platformDashboard());
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

        $salesPerMarket = Market::select(['id', 'name'])
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
            'total_markets' => Market::count(),
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
