export type ItemAvailability = "available" | "out_of_stock" | "unavailable";

export interface ItemSummary {
  id: number;
  name: string;
  image: string | null;
  price: number | null;
  base_price: number | null;
  unit: string | null;
  category: string | null;
  type: string | null;
  is_muslim_friendly: boolean;
  cutoff_time: string | null;
  is_cutoff: boolean;
  /** available | out_of_stock (back on available_on) | unavailable (seasonal). */
  availability?: ItemAvailability;
  /** YYYY-MM-DD an out-of-stock item comes back. */
  available_on?: string | null;
  /** Bulk tier — kg of this item that unlocks bulk_price; null when not bulk-eligible. */
  bulk_min_kg: number | null;
  /** Wholesale per-unit price once bulk_min_kg is reached. */
  bulk_price: number | null;
  /** Max delivery covered by BULK-FREESHIP when bulk is reached. */
  bulk_delivery_subsidy_cap: number | null;
}

export interface ItemDetail {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  type: string | null;
  is_muslim_friendly: boolean;
  unit: string | null;
  /** null when the item is out of stock or seasonal (not orderable). */
  price: number | null;
  base_price: number | null;
  price_at: string | null;
  cutoff_time: string | null;
  is_cutoff: boolean;
  /** available | out_of_stock (back on available_on) | unavailable (seasonal). */
  availability?: ItemAvailability;
  /** YYYY-MM-DD an out-of-stock item comes back. */
  available_on?: string | null;
  /** Bulk tier — kg of this item that unlocks bulk_price; null when not bulk-eligible. */
  bulk_min_kg: number | null;
  /** Wholesale per-unit price once bulk_min_kg is reached. */
  bulk_price: number | null;
  /** Max delivery covered by BULK-FREESHIP when bulk is reached. */
  bulk_delivery_subsidy_cap: number | null;
}

/** Label for a non-orderable item, e.g. "Out of stock · Back tomorrow". */
export function availabilityLabel(item: {
  availability?: ItemAvailability;
  available_on?: string | null;
  price: number | null;
}): { title: string; detail: string } | null {
  if (
    item.price !== null &&
    item.availability !== "out_of_stock" &&
    item.availability !== "unavailable"
  ) {
    return null;
  }
  if (item.availability === "out_of_stock") {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    const when =
      !item.available_on || item.available_on === tomorrow
        ? "tomorrow"
        : item.available_on <= today
          ? "soon"
          : new Date(`${item.available_on}T00:00:00`).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            });
    return { title: "Out of stock", detail: `Sold out today · back ${when}` };
  }
  return { title: "Unavailable", detail: "Seasonal · not in the market right now" };
}
