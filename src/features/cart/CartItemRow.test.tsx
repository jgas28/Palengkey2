import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import CartItemRow from "./CartItemRow";
import type { CartItemRow as CartItemRowType } from "@/types/cart";

vi.mock("@/services/api/cart", () => ({
  updateCartItem: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  removeCartItem: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const { updateCartItem, removeCartItem } = await import("@/services/api/cart");

const item: CartItemRowType = {
  id: 10,
  item_id: 1,
  name: "Tomato",
  image: null,
  unit: "kg",
  price: "240.00",
  unit_price: "120.00",
  base_unit_price: "100.00",
  quantity: 2,
  type: null,
  category: "Vegetables",
  weight_kg: 0.5,
  customer_note: "Please choose ripe ones.",
  item_quantity: 2,
  subtotal: "240.00",
  cutoff_time: "17:00",
  is_cutoff: false,
};

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CartItemRow", () => {
  it("renders name, weight, note, and subtotal", () => {
    renderWithClient(<CartItemRow item={item} selected onToggleSelect={vi.fn()} />);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.getByText(/500 g each/)).toBeInTheDocument();
    expect(screen.getByText("Note: Please choose ripe ones.")).toBeInTheDocument();
    expect(screen.getAllByText(/240/).length).toBeGreaterThan(0);
  });

  it("calls updateCartItem when quantity is increased", async () => {
    renderWithClient(<CartItemRow item={item} selected onToggleSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(updateCartItem).toHaveBeenCalledWith(10, 3);
  });

  it("calls removeCartItem when the remove button is tapped", async () => {
    renderWithClient(<CartItemRow item={item} selected onToggleSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Tomato" }));

    expect(removeCartItem).toHaveBeenCalledWith(10);
  });

  it("reflects the selected prop and calls onToggleSelect", async () => {
    const onToggleSelect = vi.fn();
    renderWithClient(
      <CartItemRow item={item} selected={false} onToggleSelect={onToggleSelect} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Select Tomato" });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });
});
