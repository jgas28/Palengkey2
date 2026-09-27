import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderStatusBadge from "./OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("shows the label for a current status", () => {
    render(<OrderStatusBadge status="out_for_delivery" />);
    expect(screen.getByText("Out for Delivery")).toBeInTheDocument();
  });

  it("normalizes a legacy status before labeling", () => {
    render(<OrderStatusBadge status="completed" />);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });
});
