import type { AdminOrderItem } from "@/types/adminOrder";

/** What haggling saved on this line: (listed − paid) × quantity bought. Null until both are known. */
export function vendorSavings(item: AdminOrderItem): number | null {
  if (item.vendor_price === null || item.vendor_price === undefined) return null;
  if (item.vendor_list_price === null || item.vendor_list_price === undefined)
    return null;
  return (
    (Number(item.vendor_list_price) - Number(item.vendor_price)) * Number(item.quantity)
  );
}
