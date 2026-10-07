import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PkProductCard from "./PkProductCard";
import type { ItemSummary } from "@/types/item";

const baseItem: ItemSummary = {
  id: 1,
  name: "Tomato",
  image: null,
  price: 120,
  base_price: 100,
  unit: "kg",
  category: "Vegetables",
  type: null,
  is_muslim_friendly: false,
  cutoff_time: "17:00",
  is_cutoff: false,
  bulk_min_kg: null,
  bulk_price: null,
  bulk_delivery_subsidy_cap: null,
};

describe("PkProductCard", () => {
  it("renders the name, category and price", () => {
    render(<PkProductCard item={baseItem} onView={vi.fn()} />);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
    expect(screen.getByText("₱120")).toBeInTheDocument();
  });

  it("opens the product when Add is pressed", async () => {
    const onView = vi.fn();
    render(<PkProductCard item={baseItem} onView={onView} />);

    await userEvent.click(screen.getByRole("button", { name: /Add/ }));

    expect(onView).toHaveBeenCalledOnce();
  });

  it("tags bulk-eligible items", () => {
    render(<PkProductCard item={{ ...baseItem, bulk_min_kg: 10, bulk_price: 105 }} onView={vi.fn()} />);

    expect(screen.getByText("Bulk 10kg+")).toBeInTheDocument();
  });

  it("disables adding when the market has no price", () => {
    render(<PkProductCard item={{ ...baseItem, price: null }} onView={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
  });

  it("flags past-cutoff items as order later", () => {
    render(<PkProductCard item={{ ...baseItem, is_cutoff: true }} onView={vi.fn()} />);

    expect(screen.getByText("Order later")).toBeInTheDocument();
  });
});
