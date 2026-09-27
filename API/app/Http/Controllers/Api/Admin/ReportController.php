<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerVerification;
use App\Models\Order;
use App\Models\Rider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function verifications(Request $request)
    {
        [$start, $end] = $this->dateRange($request);

        $verifications = CustomerVerification::with('customer', 'reviewedByUser')
            ->whereBetween(DB::raw('DATE(created_at)'), [$start, $end])
            ->orderByDesc('created_at')
            ->get();

        $total = $verifications->count();
        $approved = $verifications->where('status', 'approved')->count();
        $rejected = $verifications->where('status', 'rejected')->count();
        $pending = $verifications->where('status', 'pending')->count();

        if ($request->query('format') === 'csv') {
            return $this->streamCsv(
                "verifications_report_{$start}_to_{$end}.csv",
                ['Customer', 'Email', 'Phone', 'ID Type', 'ID Number', 'Status', 'Submitted', 'Reviewed', 'Reviewed By', 'Notes'],
                $verifications,
                fn (CustomerVerification $v) => [
                    $v->customer ? trim($v->customer->fname.' '.$v->customer->lname) : null,
                    $v->customer?->email,
                    $v->customer?->phone,
                    $v->id_type,
                    $v->id_number,
                    $v->status,
                    $v->created_at?->format('Y-m-d H:i'),
                    $v->reviewed_at?->format('Y-m-d H:i'),
                    $v->reviewedByUser?->name,
                    $v->review_notes,
                ],
            );
        }

        return response()->json([
            'start_date' => $start,
            'end_date' => $end,
            'total_submissions' => $total,
            'approved' => $approved,
            'rejected' => $rejected,
            'pending' => $pending,
            'approval_rate' => $total > 0 ? round($approved / $total * 100, 1) : 0,
            'verifications' => $verifications->map(fn (CustomerVerification $v) => [
                'id' => $v->id,
                'customer_name' => $v->customer ? trim($v->customer->fname.' '.$v->customer->lname) : null,
                'customer_email' => $v->customer?->email,
                'customer_phone' => $v->customer?->phone,
                'id_type' => $v->id_type,
                'id_number' => $v->id_number,
                'status' => $v->status,
                'submitted_at' => $v->created_at?->toIso8601String(),
                'reviewed_at' => $v->reviewed_at?->toIso8601String(),
                'reviewed_by' => $v->reviewedByUser?->name,
                'review_notes' => $v->review_notes,
            ]),
        ]);
    }

    public function activities(Request $request)
    {
        [$start, $end] = $this->dateRange($request);

        $orders = Order::with('market')
            ->whereBetween(DB::raw('DATE(created_at)'), [$start, $end])
            ->get();

        $marketActivity = $orders->groupBy('market_id')->map(function ($marketOrders) {
            $completed = $marketOrders->whereIn('status', ['delivered', 'completed']);
            $cancelled = $marketOrders->where('status', 'cancelled');
            $pending = $marketOrders->whereNotIn('status', ['delivered', 'completed', 'cancelled']);

            return [
                'market_id' => $marketOrders->first()->market_id,
                'market_name' => $marketOrders->first()->market?->name,
                'total_orders' => $marketOrders->count(),
                'total_sales' => (float) $completed->sum('total_amount'),
                'completed_orders' => $completed->count(),
                'pending_orders' => $pending->count(),
                'cancelled_orders' => $cancelled->count(),
            ];
        })->sortByDesc('total_sales')->values();

        $riderActivity = Rider::query()
            ->withCount(['orders as total_deliveries' => function ($q) use ($start, $end) {
                $q->whereIn('status', ['delivered', 'completed'])
                    ->whereBetween(DB::raw('DATE(orders.created_at)'), [$start, $end]);
            }])
            ->withSum(['orders as total_delivery_amount' => function ($q) use ($start, $end) {
                $q->whereIn('status', ['delivered', 'completed'])
                    ->whereBetween(DB::raw('DATE(orders.created_at)'), [$start, $end]);
            }], 'total_amount')
            ->having('total_deliveries', '>', 0)
            ->orderByDesc('total_deliveries')
            ->get()
            ->map(fn (Rider $rider) => [
                'rider_id' => $rider->id,
                'rider_name' => $rider->name,
                'total_deliveries' => $rider->total_deliveries,
                'total_delivery_amount' => (float) ($rider->total_delivery_amount ?? 0),
                'average_delivery_value' => $rider->total_deliveries > 0
                    ? round(($rider->total_delivery_amount ?? 0) / $rider->total_deliveries, 2)
                    : 0,
            ]);

        if ($request->query('format') === 'csv') {
            return $this->streamActivitiesCsv($start, $end, $marketActivity, $riderActivity);
        }

        return response()->json([
            'start_date' => $start,
            'end_date' => $end,
            'market_activity' => $marketActivity,
            'rider_activity' => $riderActivity,
        ]);
    }

    private function streamActivitiesCsv(string $start, string $end, $marketActivity, $riderActivity)
    {
        $filename = "activities_report_{$start}_to_{$end}.csv";

        return response()->stream(function () use ($marketActivity, $riderActivity) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");

            fputcsv($file, ['MARKET ACTIVITY']);
            fputcsv($file, ['Market', 'Total Orders', 'Total Sales', 'Completed', 'Pending', 'Cancelled']);
            foreach ($marketActivity as $row) {
                fputcsv($file, [
                    $row['market_name'], $row['total_orders'], $row['total_sales'],
                    $row['completed_orders'], $row['pending_orders'], $row['cancelled_orders'],
                ]);
            }

            fputcsv($file, []);
            fputcsv($file, ['RIDER ACTIVITY']);
            fputcsv($file, ['Rider', 'Total Deliveries', 'Total Delivery Amount', 'Average Delivery Value']);
            foreach ($riderActivity as $row) {
                fputcsv($file, [
                    $row['rider_name'], $row['total_deliveries'], $row['total_delivery_amount'], $row['average_delivery_value'],
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }

    private function streamCsv(string $filename, array $headers, $rows, \Closure $mapRow)
    {
        return response()->stream(function () use ($headers, $rows, $mapRow) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, $headers);

            foreach ($rows as $row) {
                fputcsv($file, $mapRow($row));
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }
    public function sales(Request $request)
    {
        [$start, $end] = $this->dateRange($request);
        $format = $request->query('format', 'json');

        if ($format === 'csv') {
            return $this->exportCsv($start, $end);
        }

        if ($format === 'xlsx') {
            // maatwebsite/excel isn't installed yet — fail clearly rather than
            // silently returning the wrong format.
            return response()->json(['message' => 'XLSX export is not available yet. Use CSV instead.'], 422);
        }

        $orders = Order::with('market', 'customer')
            ->whereBetween(DB::raw('DATE(created_at)'), [$start, $end])
            ->whereIn('status', ['delivered', 'completed'])
            ->orderByDesc('created_at')
            ->get();

        $totalOrders = $orders->count();
        $totalSales = (float) $orders->sum('total_amount');
        $totalItems = (int) DB::table('order_items')->whereIn('order_id', $orders->pluck('id'))->sum('quantity');

        $salesByMarket = $orders->groupBy('market_id')->map(fn ($marketOrders) => [
            'market_id' => $marketOrders->first()->market_id,
            'market_name' => $marketOrders->first()->market?->name,
            'total_orders' => $marketOrders->count(),
            'total_sales' => (float) $marketOrders->sum('total_amount'),
        ])->sortByDesc('total_sales')->values();

        return response()->json([
            'start_date' => $start,
            'end_date' => $end,
            'total_orders' => $totalOrders,
            'total_sales' => $totalSales,
            'total_items' => $totalItems,
            'average_order_value' => $totalOrders > 0 ? round($totalSales / $totalOrders, 2) : 0,
            'sales_by_market' => $salesByMarket,
            'orders' => $orders->map(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'created_at' => $order->created_at?->toIso8601String(),
                'market_name' => $order->market?->name,
                'customer_name' => $order->customer ? trim($order->customer->fname.' '.$order->customer->lname) : null,
                'subtotal' => (float) $order->subtotal,
                'delivery_fee' => (float) $order->delivery_fee,
                'service_fee' => (float) $order->service_fee,
                'total_amount' => (float) $order->total_amount,
                'payment_method' => $order->payment_method,
            ]),
        ]);
    }

    private function exportCsv(string $start, string $end)
    {
        $filename = "sales_report_{$start}_to_{$end}.csv";

        $orders = Order::with('market', 'customer')
            ->whereBetween(DB::raw('DATE(created_at)'), [$start, $end])
            ->whereIn('status', ['delivered', 'completed'])
            ->orderBy('created_at')
            ->get();

        return response()->stream(function () use ($orders) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['Order #', 'Date', 'Market', 'Customer', 'Subtotal', 'Delivery Fee', 'Service Fee', 'Total', 'Payment Method']);

            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->order_number,
                    $order->created_at?->format('Y-m-d H:i'),
                    $order->market?->name,
                    $order->customer ? trim($order->customer->fname.' '.$order->customer->lname) : null,
                    (float) $order->subtotal,
                    (float) $order->delivery_fee,
                    (float) $order->service_fee,
                    (float) $order->total_amount,
                    $order->payment_method,
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }

    private function dateRange(Request $request): array
    {
        $start = $request->query('start_date') ?: now()->subDays(30)->toDateString();
        $end = $request->query('end_date') ?: now()->toDateString();

        return [$start, $end];
    }
}
