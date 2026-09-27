import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { removeRecipeBundle } from "@/services/api/paluto";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { CartRecipeBundle } from "@/types/paluto";

export interface CartRecipeBundleRowProps {
  bundle: CartRecipeBundle;
  selected: boolean;
  onToggleSelect: () => void;
}

export default function CartRecipeBundleRow({
  bundle,
  selected,
  onToggleSelect,
}: CartRecipeBundleRowProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const removeMutation = useMutation({
    mutationFn: () => removeRecipeBundle(bundle.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not remove recipe.",
        "error",
      );
    },
  });

  const cookingFee = Number(bundle.cooking_fee);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-4">
      <div className="flex gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${bundle.recipe_name}`}
          className="mt-1 h-5 w-5 shrink-0 self-start accent-[#0097A7]"
        />

        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F7FAFA]">
          {bundle.image && (
            <img
              src={bundle.image}
              alt={bundle.recipe_name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold leading-tight text-[#203238]">
              {bundle.recipe_name}
            </h3>
            <button
              type="button"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              aria-label={`Remove ${bundle.recipe_name}`}
              className="shrink-0 p-1 text-[#66777C] transition-colors hover:text-[#F05A47] disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-0.5 text-xs text-[#66777C]">
            {bundle.quantity} {bundle.pricing_unit === "kg" ? "kg" : "serving(s)"}
          </p>

          <p className="text-xs font-semibold text-[#0097A7]">
            {bundle.stall_name ? `Paluto at ${bundle.stall_name}` : "Ingredients only"}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#66777C]">
              {cookingFee > 0 ? `+${formatPeso(cookingFee)} cooking fee` : ""}
            </span>
            <span className="font-bold text-[#203238]">
              {formatPeso(Number(bundle.subtotal))}
            </span>
          </div>
        </div>
      </div>

      {bundle.ingredients.length > 0 && (
        <ul className="ml-[5.75rem] flex flex-col gap-0.5 border-l border-[#DDE9EA] pl-3 text-xs text-[#66777C]">
          {bundle.ingredients.map((ingredient) => (
            <li key={ingredient.id}>
              {ingredient.name} × {ingredient.item_quantity} {ingredient.unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
