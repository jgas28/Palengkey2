import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationBell from "./NotificationBell";

vi.mock("@/services/api/notifications", () => ({
  getUnreadCount: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
}));

const { getUnreadCount } = await import("@/services/api/notifications");

function renderBell() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NotificationBell", () => {
  it("shows no badge when there are no unread notifications", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(0);
    renderBell();

    expect(
      await screen.findByRole("link", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("shows a badge with the unread count", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(3);
    renderBell();

    expect(
      await screen.findByRole("link", { name: "Notifications, 3 unread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 99+", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(150);
    renderBell();

    expect(await screen.findByText("99+")).toBeInTheDocument();
  });
});
