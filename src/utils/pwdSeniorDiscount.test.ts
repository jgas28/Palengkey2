import { describe, expect, it } from "vitest";
import { pwdSeniorDiscount } from "./pwdSeniorDiscount";

describe("pwdSeniorDiscount", () => {
  it("takes 20% of the delivery fee after splitting off VAT", () => {
    expect(pwdSeniorDiscount(49)).toEqual({
      deliveryFee: 49,
      vat: 5.88,
      vatExclusive: 43.12,
      discount: 8.62,
    });
    expect(pwdSeniorDiscount(87.5).discount).toBe(15.4);
  });

  it("is zero when there's no delivery fee left to discount", () => {
    expect(pwdSeniorDiscount(0).discount).toBe(0);
    expect(pwdSeniorDiscount(-10).discount).toBe(0);
  });
});
