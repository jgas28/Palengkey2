import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsListView from "./NotificationsListView";
import type { Notification } from "@/types/notification";

vi.mock("@/services/api/notifications", () => ({
  listNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  clearAllNotifications: vi.fn(),
}));

const { listNotifications, markAsRead } = await import("@/services/api/notifications");

const unread: Notification = {
  id: 1,
  customer_id: 1,
  type: "order_status",
  title: "Order Update",
  message: "Your order #ORD-1 has been confirmed!",
  icon: null,
  order_id: 42,
  order_status: "order_confirmed",
  is_read: false,
  read_at: null,
  data: null,
  action_url: null,
  created_at: "2026-01-01T00:00:00Z",
};

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsListView />} />
          <Route path="/orders/:orderId" element={<p>Order detail page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NotificationsListView", () => {
  beforeEach(() => {
    vi.mocked(listNotifications).mockReset();
    vi.mocked(markAsRead).mockReset();
  });

  it("shows an empty state when there are no notifications", async () => {
    vi.mocked(listNotifications).mockResolvedValue({
      notifications: [],
      unread_count: 0,
    });
    renderView();

    expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
  });

  it("marks an unread notification as read and navigates to its order on tap", async () => {
    vi.mocked(listNotifications).mockResolvedValue({
      notifications: [unread],
      unread_count: 1,
    });
    vi.mocked(markAsRead).mockResolvedValue({ ...unread, is_read: true });
    renderView();

    await userEvent.click(await screen.findByText("Order Update"));

    expect(markAsRead).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Order detail page")).toBeInTheDocument();
  });
});
