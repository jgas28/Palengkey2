import { describe, expect, it } from "vitest";
import { isTerminalPaymentStatus } from "./usePaymentStatus";

describe("isTerminalPaymentStatus", () => {
  it.each(["paid", "expired", "failed"] as const)("returns true for %s", (status) => {
    expect(isTerminalPaymentStatus(status)).toBe(true);
  });

  it("returns false for pending", () => {
    expect(isTerminalPaymentStatus("pending")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTerminalPaymentStatus(undefined)).toBe(false);
  });
});
