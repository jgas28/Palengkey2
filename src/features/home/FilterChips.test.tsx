import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterChips from "./FilterChips";

const categories = [{ id: 1, name: "Vegetables" }];
const types = [{ id: 2, name: "Halal", is_halal: true }];

describe("FilterChips", () => {
  it("calls onCategoryChange with the category id when tapped", async () => {
    const onCategoryChange = vi.fn();
    render(
      <FilterChips
        categories={categories}
        types={types}
        activeCategoryId={null}
        activeTypeId={null}
        onCategoryChange={onCategoryChange}
        onTypeChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Vegetables" }));

    expect(onCategoryChange).toHaveBeenCalledWith(1);
  });

  it("toggles the active category off when tapped again", async () => {
    const onCategoryChange = vi.fn();
    render(
      <FilterChips
        categories={categories}
        types={types}
        activeCategoryId={1}
        activeTypeId={null}
        onCategoryChange={onCategoryChange}
        onTypeChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Vegetables" }));

    expect(onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("resets both filters when All is tapped", async () => {
    const onCategoryChange = vi.fn();
    const onTypeChange = vi.fn();
    render(
      <FilterChips
        categories={categories}
        types={types}
        activeCategoryId={1}
        activeTypeId={2}
        onCategoryChange={onCategoryChange}
        onTypeChange={onTypeChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "All" }));

    expect(onCategoryChange).toHaveBeenCalledWith(null);
    expect(onTypeChange).toHaveBeenCalledWith(null);
  });
});
