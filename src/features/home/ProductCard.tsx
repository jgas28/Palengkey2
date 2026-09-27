import { useState } from "react";
import { ImageOff, Plus } from "lucide-react";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ItemSummary } from "@/types/item";

export interface ProductCardProps {
  item: ItemSummary;
  onClick: () => void;
}

export default function ProductCard({ item, onClick }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-soft transition-all duration-200 active:scale-[0.98] md:hover:-translate-y-1 md:hover:shadow-lifted"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-primary-50">
        {item.image && !imageFailed ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-300">
            <ImageOff size={32} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {item.is_muslim_friendly && (
            <span className="rounded-pill bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              Halal
            </span>
          )}
          {item.is_cutoff && (
            <span className="rounded-pill bg-status-preparing px-2 py-0.5 text-[11px] font-semibold text-white">
              Past cutoff
            </span>
          )}
        </div>

        {item.price !== null && (
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-card transition-transform duration-150 group-active:scale-90 md:group-hover:scale-110"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-medium leading-snug text-text">
          {item.name}
        </span>
        <div className="mt-auto pt-1">
          {item.price !== null ? (
            <PriceDisplay amount={item.price} unit={item.unit ?? undefined} size="sm" />
          ) : (
            <span className="text-sm text-text-muted">Unavailable</span>
          )}
        </div>
      </div>
    </button>
  );
}
