import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to cart</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Add to cart
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("disables the button while loading", () => {
    render(<Button loading>Placing order</Button>);

    expect(screen.getByRole("button", { name: "Placing order" })).toBeDisabled();
  });
});
