import { useState } from "react";
import { ChefHat, ChevronRight } from "lucide-react";
import type { RecipeSummary } from "@/types/paluto";

export interface RecipeCardProps {
  recipe: RecipeSummary;
  onClick: () => void;
}

function formatBaseQuantity(recipe: RecipeSummary): string {
  const baseQuantity = Number(recipe.base_quantity);
  const qty = Number.isInteger(baseQuantity) ? baseQuantity : baseQuantity.toFixed(2);
  return recipe.pricing_unit === "kg" ? `${qty} kg batch` : `Serves ${qty}`;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white text-left transition-all duration-200 active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#E8F7F7]">
        {recipe.image && !imageFailed ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#0097A7]/40">
            <ChefHat size={36} aria-hidden="true" />
          </div>
        )}

        {recipe.recipe_type && (
          <span className="absolute left-2 top-2 rounded-full bg-[#0097A7] px-2 py-0.5 text-[11px] font-semibold text-white">
            {recipe.recipe_type}
          </span>
        )}

        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0097A7] text-white shadow-md transition-transform duration-150 group-active:scale-90 md:group-hover:scale-110"
        >
          <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-medium leading-snug text-[#203238]">
          {recipe.name}
        </span>
        <div className="mt-auto pt-1">
          <span className="text-sm font-bold text-[#0097A7]">
            {formatBaseQuantity(recipe)}
          </span>
        </div>
      </div>
    </button>
  );
}
