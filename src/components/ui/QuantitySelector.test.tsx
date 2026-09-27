import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuantitySelector from "./QuantitySelector";

describe("QuantitySelector", () => {
  it("increments and decrements via onChange", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={2} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables the decrease button at the minimum", () => {
    render(<QuantitySelector value={1} onChange={vi.fn()} min={1} />);

    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  });

  it("disables the increase button at the maximum", () => {
    render(<QuantitySelector value={5} onChange={vi.fn()} max={5} />);

    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });
});
