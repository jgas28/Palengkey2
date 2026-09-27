import { useState } from "react";
import { ShoppingBasket } from "lucide-react";
import type { Category } from "@/types/category";

export interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  active?: boolean;
}

export default function CategoryCard({
  category,
  onClick,
  active = false,
}: CategoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = category.image_url && !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center transition-transform duration-150 active:scale-95 sm:w-20"
    >
      <span
        className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border transition-colors sm:h-20 sm:w-20 ${
          active
            ? "border-primary-500 bg-primary-500 ring-2 ring-primary-200"
            : "border-border bg-primary-50 ring-2 ring-transparent md:hover:ring-primary-200"
        }`}
      >
        {showImage ? (
          <img
            src={category.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBasket
            size={24}
            className={active ? "text-white" : "text-primary-600"}
            aria-hidden="true"
          />
        )}
      </span>
      <span className="line-clamp-2 text-xs font-medium leading-tight text-text">
        {category.name}
      </span>
    </button>
  );
}
