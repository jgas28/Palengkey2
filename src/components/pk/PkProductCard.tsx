import { useState } from "react";
import Icon from "@/components/pk/Icon";
import type { ItemSummary } from "@/types/item";

export interface PkProductCardProps {
  item: ItemSummary;
  /** Opens the product (quick view / detail) — adding always goes through it so
   * the customer picks a weight and note, like the Figma shop flow. */
  onView: () => void;
}

function formatKg(kg: number): string {
  return Number(kg.toFixed(3)).toString();
}

/** The design's product card (.product-card), bound to a real catalog item. */
export default function PkProductCard({ item, onView }: PkProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const unavailable = item.price === null;
  const tag = item.bulk_min_kg
    ? `Bulk ${formatKg(item.bulk_min_kg)}kg+`
    : (item.type ?? "Fresh today");

  return (
    <article className={`product-card ${unavailable ? "product-disabled" : ""}`}>
      <div className={`product-image ${unavailable || item.is_cutoff ? "has-status" : ""}`}>
        {item.image && !imageFailed ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--teal)" }}
          >
            <Icon name="leaf" size={34} />
          </div>
        )}
        <span
          className="fresh-tag"
          style={item.bulk_min_kg ? { color: "#704a08", background: "#fef0c7" } : undefined}
        >
          {tag}
        </span>
        {unavailable && <span className="stock-badge unavailable">Unavailable</span>}
        {!unavailable && item.is_cutoff && (
          <span className="stock-badge" style={{ background: "var(--teal-dark)" }}>
            Order later
          </span>
        )}
        <button type="button" className="quick-view" onClick={onView}>
          <Icon name="search" size={15} /> Quick view
        </button>
      </div>
      <div className="product-body">
        <p className="eyebrow">{item.category ?? "Market item"}</p>
        <h3>{item.name}</h3>
        <div className="product-bottom">
          <p>
            {unavailable ? (
              <strong style={{ color: "var(--muted)" }}>—</strong>
            ) : (
              <strong>₱{Number(item.price).toLocaleString("en-PH")}</strong>
            )}
            <span> / {item.unit ?? "pc"}</span>
          </p>
          <button
            type="button"
            className="btn add"
            disabled={unavailable}
            onClick={() => !unavailable && onView()}
          >
            {unavailable ? (
              "Unavailable"
            ) : (
              <>
                <Icon name="plus" size={17} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
