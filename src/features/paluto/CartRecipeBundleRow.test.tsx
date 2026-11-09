import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CartRecipeBundleRow from "./CartRecipeBundleRow";
import type { CartRecipeBundle } from "@/types/paluto";

const bundle = {
  id: 1,
  recipe_name: "Sinigang",
  stall_name: "Aling Nena",
  paluto_stall_id: 3,
  quantity: 1,
  pricing_unit: "serving",
  cooking_fee: 50,
  subtotal: 300,
  ingredients: [],
} as unknown as CartRecipeBundle;

function renderRow(blocked: boolean) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CartRecipeBundleRow
        bundle={bundle}
        selected={false}
        onToggleSelect={vi.fn()}
        blocked={blocked}
      />
    </QueryClientProvider>,
  );
}

describe("CartRecipeBundleRow while the market is closed", () => {
  it("can't be selected and says why", () => {
    renderRow(true);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(
      screen.getByText(/isn.t available while the market is closed/),
    ).toBeInTheDocument();
  });

  it("is selectable normally", () => {
    renderRow(false);
    expect(screen.getByRole("checkbox")).toBeEnabled();
    expect(screen.queryByText(/market is closed/)).not.toBeInTheDocument();
  });
});
