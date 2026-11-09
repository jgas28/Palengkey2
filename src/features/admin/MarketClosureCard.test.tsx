import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MarketClosureCard from "./MarketClosureCard";

vi.mock("@/services/api/adminMarketClosure", () => ({
  marketClosureQueryKey: (id?: number) => ["closure", id],
  getMarketClosure: vi.fn(),
  closeMarket: vi.fn(),
  reopenMarket: vi.fn(),
}));

const { getMarketClosure, closeMarket, reopenMarket } =
  await import("@/services/api/adminMarketClosure");

const open = {
  market_id: 7,
  market_name: "Alabang",
  min_reopen_date: "2026-11-09",
  max_reopen_date: "2027-02-06",
  is_closed: false,
  closed_until: null,
  reopens_on: null,
  closed_reason: null,
};
const closed = {
  ...open,
  is_closed: true,
  closed_until: "2026-11-12T05:00:00+08:00",
  reopens_on: "2026-11-12",
  closed_reason: "Holiday",
};

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MarketClosureCard marketId={7} />
    </QueryClientProvider>,
  );
}

describe("MarketClosureCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("needs a reopen date, then closes the market", async () => {
    vi.mocked(getMarketClosure).mockResolvedValue(open);
    vi.mocked(closeMarket).mockResolvedValue({ ...closed, message: "closed" });
    renderCard();

    const button = await screen.findByRole("button", { name: "Close market" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reopen on"), {
      target: { value: "2026-11-12" },
    });
    fireEvent.change(screen.getByLabelText(/Note to customers/), {
      target: { value: "  Holiday " },
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(closeMarket).toHaveBeenCalledWith({
        market_id: 7,
        reopen_date: "2026-11-12",
        closed_reason: "Holiday",
      }),
    );
    expect(await screen.findByRole("button", { name: "Reopen now" })).toBeInTheDocument();
  });

  it("shows the closure and can reopen early", async () => {
    vi.mocked(getMarketClosure).mockResolvedValue(closed);
    vi.mocked(reopenMarket).mockResolvedValue({ ...open, message: "open" });
    renderCard();

    expect(await screen.findByText(/Order Later only until/)).toBeInTheDocument();
    expect(screen.getByText(/Holiday/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reopen now" }));
    await waitFor(() => expect(reopenMarket).toHaveBeenCalledWith(7));
    expect(
      await screen.findByRole("button", { name: "Close market" }),
    ).toBeInTheDocument();
  });
});
