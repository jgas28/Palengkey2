import { describe, expect, it } from "vitest";
import { voucherBreakdown } from "./voucherBreakdown";
import type { VoucherValidation } from "@/types/voucher";

const base: VoucherValidation = {
  id: 1,
  code: "TEST",
  description: null,
  discount_type: "percentage",
  discount_value: 10,
  applies_to: ["subtotal"],
  max_discount_amount: null,
  min_order_amount: null,
  usage_limit: null,
  per_customer_limit: 1,
};
const amounts = { subtotal: 1200, service_fee: 30, delivery_fee: 49 };

describe("voucherBreakdown", () => {
  it("applies a percentage to the subtotal", () => {
    expect(voucherBreakdown(base, amounts).total).toBe(120);
  });

  it("caps a percentage at max_discount_amount", () => {
    const { lines, total } = voucherBreakdown(
      { ...base, max_discount_amount: 100 },
      amounts,
    );
    expect(total).toBe(100);
    expect(lines[0].capped).toBe(true);
  });

  it("applies to each target separately and never exceeds the amount", () => {
    const { lines, total } = voucherBreakdown(
      {
        ...base,
        discount_type: "fixed",
        discount_value: 60,
        applies_to: ["subtotal", "delivery_fee"],
      },
      amounts,
    );
    expect(lines.map((line) => line.discount)).toEqual([60, 49]);
    expect(total).toBe(109);
  });
});
