import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "./ProductCard";
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
};

describe("ProductCard", () => {
  it("renders the product name and price", () => {
    render(<ProductCard item={baseItem} onClick={vi.fn()} />);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });

  it("calls onClick when tapped", async () => {
    const onClick = vi.fn();
    render(<ProductCard item={baseItem} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a Halal badge only when is_muslim_friendly is true", () => {
    const { rerender } = render(<ProductCard item={baseItem} onClick={vi.fn()} />);
    expect(screen.queryByText("Halal")).not.toBeInTheDocument();

    rerender(
      <ProductCard item={{ ...baseItem, is_muslim_friendly: true }} onClick={vi.fn()} />,
    );
    expect(screen.getByText("Halal")).toBeInTheDocument();
  });

  it("shows a past-cutoff badge when is_cutoff is true", () => {
    render(<ProductCard item={{ ...baseItem, is_cutoff: true }} onClick={vi.fn()} />);
    expect(screen.getByText("Past cutoff")).toBeInTheDocument();
  });
});
