import Icon from "@/components/pk/Icon";
import { formatKg, kgToGo } from "@/features/bulk/bulkFormat";
import { formatPeso } from "@/utils/currency";
import type { CartBulkSummary } from "@/types/cart";

export interface CartBulkBannerProps {
  bulk: CartBulkSummary;
}

/** "Bulk Suki Unlocked!" once a line qualifies; otherwise how close each eligible item is. Styled as the design's .notice. */
export default function CartBulkBanner({ bulk }: CartBulkBannerProps) {
  const pending = bulk.items.filter((entry) => !entry.qualifies);
  const savings = Number(bulk.savings);
  const cap = Number(bulk.delivery_subsidy_cap);

  if (!bulk.active && pending.length === 0) return null;

  return (
    <div className="notice" role="status" style={{ alignItems: "flex-start" }}>
      <Icon name="sparkle" />
      <div>
        <strong>
          {bulk.active
            ? "🎉 Bulk Suki Unlocked!"
            : `Buy in bulk for wholesale prices + delivery up to ${formatPeso(cap)}`}
        </strong>
        {bulk.active && (
          <p>
            Wholesale pricing applied{savings > 0 ? ` — you're saving ${formatPeso(savings)}` : ""}.
            Delivery covered up to {formatPeso(cap)} with {bulk.voucher_code} at checkout.
          </p>
        )}
        {pending.map((entry) => (
          <p key={entry.item_id}>
            {entry.name}: {formatKg(entry.total_kg)}kg in basket — add{" "}
            {formatKg(kgToGo(entry.total_kg, entry.threshold_kg))}kg more for the bulk price (
            {formatKg(entry.threshold_kg)}kg+).
          </p>
        ))}
      </div>
      {bulk.active && <span style={{ background: "#16a34a" }}>Bulk</span>}
    </div>
  );
}
