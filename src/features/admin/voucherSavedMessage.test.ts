import { describe, expect, it } from "vitest";
import { savedMessage } from "./voucherSavedMessage";
import type { SavedVoucher } from "@/services/api/adminVouchers";

const saved = (emails?: SavedVoucher["emails"]) => ({ emails }) as SavedVoucher;

describe("savedMessage", () => {
  it("says only saved for a normal voucher", () => {
    expect(savedMessage("created", saved())).toBe("Voucher created.");
    expect(savedMessage("updated", saved({ sending: 0, skipped: 0 }))).toBe("Voucher updated.");
  });

  it("says who is being emailed and who isn't", () => {
    expect(savedMessage("created", saved({ sending: 3, skipped: 1 }))).toBe(
      "Voucher created. Emailing 3 customers. 1 customer not emailed (promo emails off or no valid email).",
    );
    expect(savedMessage("updated", saved({ sending: 1, skipped: 0 }))).toBe(
      "Voucher updated. Emailing 1 customer.",
    );
  });
});
