import { useState } from "react";
import Icon from "@/components/pk/Icon";
import { availabilityLabel, type ItemSummary } from "@/types/item";

export interface PkProductCardProps {
  item: ItemSummary;
  /** Opens the product (quick view / detail) — adding always goes through it so
   * the customer picks a weight and note, like the Figma shop flow. */
  onView: () => void;
}

/** The design's product card (.product-card), bound to a real catalog item. */
export default function PkProductCard({ item, onView }: PkProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const status = availabilityLabel(item);
  const unavailable = status !== null;
  const tag = item.type ?? "Fresh today";

  return (
    <article className={`product-card ${unavailable ? "product-disabled" : ""}`}>
      <div
        className={`product-image ${unavailable || item.is_cutoff ? "has-status" : ""}`}
      >
        {item.image && !imageFailed ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              height: "100%",
              color: "var(--teal)",
            }}
          >
            <Icon name="leaf" size={34} />
          </div>
        )}
        <span className="fresh-tag">{tag}</span>
        {status && (
          <span
            className="stock-badge unavailable"
            style={
              item.availability === "out_of_stock"
                ? { background: "#b26a00", color: "#fff" }
                : undefined
            }
            title={status.detail}
          >
            {status.title}
          </span>
        )}
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
            {status ? (
              <strong style={{ color: "var(--muted)", fontSize: 13 }}>
                {status.detail}
              </strong>
            ) : (
              <strong>₱{Number(item.price).toLocaleString("en-PH")}</strong>
            )}
            {!status && <span> / {item.unit ?? "pc"}</span>}
          </p>
          <button
            type="button"
            className="btn add"
            disabled={unavailable}
            onClick={() => !unavailable && onView()}
          >
            {status ? (
              status.title
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
