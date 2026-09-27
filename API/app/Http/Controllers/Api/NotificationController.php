<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function getNotifications(Request $request)
    {
        $customer = $request->user();
        $unreadOnly = $request->boolean('unread_only');

        $query = Notification::where('customer_id', $customer->id)->orderByDesc('created_at');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        $notifications = $query->limit((int) $request->query('limit', 20))->get();
        $unreadCount = Notification::where('customer_id', $customer->id)->where('is_read', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, int $id)
    {
        $notification = Notification::where('id', $id)->where('customer_id', $request->user()->id)->first();

        if (! $notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read', 'notification' => $notification]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('customer_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function clearAll(Request $request)
    {
        Notification::where('customer_id', $request->user()->id)->delete();

        return response()->json(['message' => 'All notifications cleared']);
    }

    public function getUnreadCount(Request $request)
    {
        $unreadCount = Notification::where('customer_id', $request->user()->id)->where('is_read', false)->count();

        return response()->json(['unread_count' => $unreadCount]);
    }
}
