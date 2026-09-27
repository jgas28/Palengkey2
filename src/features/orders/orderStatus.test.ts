import { describe, expect, it } from "vitest";
import { isOrderCancellable, normalizeOrderStatus } from "./orderStatus";

describe("normalizeOrderStatus", () => {
  it("passes through current statuses unchanged", () => {
    expect(normalizeOrderStatus("out_for_delivery")).toBe("out_for_delivery");
    expect(normalizeOrderStatus("delivered")).toBe("delivered");
    expect(normalizeOrderStatus("cancelled")).toBe("cancelled");
  });

  it("maps legacy statuses onto the current scheme", () => {
    expect(normalizeOrderStatus("pending")).toBe("order_received");
    expect(normalizeOrderStatus("accepted")).toBe("order_confirmed");
    expect(normalizeOrderStatus("ready")).toBe("out_for_delivery");
    expect(normalizeOrderStatus("completed")).toBe("delivered");
  });

  it("falls back to order_received for unknown statuses", () => {
    expect(normalizeOrderStatus("something_unexpected")).toBe("order_received");
  });
});

describe("isOrderCancellable", () => {
  it("is cancellable when just received", () => {
    expect(isOrderCancellable("order_received", "cod")).toBe(true);
  });

  it("is cancellable while awaiting cashless payment", () => {
    expect(isOrderCancellable("pending_payment", "qrph")).toBe(true);
    expect(isOrderCancellable("pending_payment", "bpi")).toBe(true);
  });

  it("is not cancellable once confirmed or for COD pending payment", () => {
    expect(isOrderCancellable("order_confirmed", "cod")).toBe(false);
    expect(isOrderCancellable("pending_payment", "cod")).toBe(false);
  });
});
