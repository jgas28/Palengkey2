import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentMethodsCard from "./PaymentMethodsCard";

vi.mock("@/services/api/adminSettings", () => ({
  paymentMethodsQueryKey: ["adminPaymentMethods"],
  getPaymentMethods: vi.fn(),
  setPaymentMethod: vi.fn(),
}));

const { getPaymentMethods, setPaymentMethod } = await import("@/services/api/adminSettings");

const on = (method: string, label: string) => ({
  method,
  label,
  enabled: true,
  reason: null,
  changed_by: null,
  changed_at: null,
});
const gcashOff = {
  ...on("gcash", "GCash"),
  enabled: false,
  reason: "GCash maintenance",
  changed_by: "Ana",
  changed_at: "2026-11-16T02:00:00Z",
};

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PaymentMethodsCard />
    </QueryClientProvider>,
  );
}

describe("PaymentMethodsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("turns GCash off with a note to customers", async () => {
    vi.mocked(getPaymentMethods).mockResolvedValue([on("cod", "Cash on Delivery"), on("gcash", "GCash")]);
    vi.mocked(setPaymentMethod).mockResolvedValue({
      message: "GCash is off.",
      data: [on("cod", "Cash on Delivery"), gcashOff],
    });
    renderCard();

    fireEvent.change(await screen.findByLabelText("Note to customers for GCash"), {
      target: { value: "  GCash maintenance " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Turn off GCash" }));

    await waitFor(() =>
      expect(setPaymentMethod).toHaveBeenCalledWith("gcash", {
        enabled: false,
        reason: "GCash maintenance",
      }),
    );
    expect(await screen.findByRole("button", { name: "Turn on GCash" })).toBeInTheDocument();
    expect(screen.getByText(/“GCash maintenance” · turned off by Ana/)).toBeInTheDocument();
  });

  it("asks first, and does nothing when the admin cancels", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.mocked(getPaymentMethods).mockResolvedValue([on("gcash", "GCash")]);
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "Turn off GCash" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(setPaymentMethod).not.toHaveBeenCalled();
  });

  it("turns a method back on without a reason", async () => {
    vi.mocked(getPaymentMethods).mockResolvedValue([gcashOff]);
    vi.mocked(setPaymentMethod).mockResolvedValue({ message: "back on", data: [on("gcash", "GCash")] });
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "Turn on GCash" }));
    await waitFor(() =>
      expect(setPaymentMethod).toHaveBeenCalledWith("gcash", { enabled: true, reason: undefined }),
    );
    expect(await screen.findByRole("button", { name: "Turn off GCash" })).toBeInTheDocument();
  });
});
