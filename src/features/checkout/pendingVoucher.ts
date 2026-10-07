const KEY = "pk.pendingVoucher";

/** A voucher the customer chose on the Vouchers page — pre-filled into checkout's voucher field. */
export function savePendingVoucher(code: string): void {
  try {
    sessionStorage.setItem(KEY, code.trim().toUpperCase());
  } catch {
    // Storage blocked (private mode) — the customer can still type the code at checkout.
  }
}

export function readPendingVoucher(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
