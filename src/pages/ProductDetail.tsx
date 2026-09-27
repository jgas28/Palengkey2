import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ProductCard from "@/features/home/ProductCard";
import { getItem, listItems } from "@/services/api/items";
import { addToCart } from "@/services/api/cart";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { useMarketStore } from "@/stores/marketStore";
import { formatPeso } from "@/utils/currency";
import { isWeightUnit } from "@/utils/unit";

const WEIGHT_PRESETS = [
  { label: "125 g", kg: 0.125 },
  { label: "250 g", kg: 0.25 },
  { label: "500 g", kg: 0.5 },
  { label: "750 g", kg: 0.75 },
  { label: "1 kg", kg: 1 },
];

export default function ProductDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const id = Number(itemId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const marketId = selectedMarket?.id;

  const [quantity, setQuantity] = useState(1);
  const [weightKg, setWeightKg] = useState(WEIGHT_PRESETS[1].kg);
  const [note, setNote] = useState("");

  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["item", id, marketId],
    queryFn: () => getItem(id, marketId!),
    enabled: Number.isFinite(id) && marketId !== undefined,
  });

  const { data: relatedPage } = useQuery({
    queryKey: ["relatedItems", marketId, item?.category],
    queryFn: () => listItems({ marketId: marketId!, search: undefined, page: 1 }),
    enabled: marketId !== undefined && Boolean(item),
  });
  const related = (relatedPage?.data ?? [])
    .filter((i) => i.id !== id && (!item?.category || i.category === item.category))
    .slice(0, 4);

  const weighted = item ? isWeightUnit(item.unit) : false;

  const addMutation = useMutation({
    mutationFn: () =>
      addToCart({
        item_id: id,
        market_id: marketId!,
        quantity,
        weight_kg: weighted ? weightKg : undefined,
        customer_note: note.trim() || undefined,
      }),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add to cart.", "error");
    },
  });

  async function handleAddToCart() {
    try {
      await addMutation.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast("Added to cart", "success");
    } catch {
      // toast already shown by addMutation.onError
    }
  }

  async function handleBuyNow() {
    try {
      const { data } = await addMutation.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      const expectedWeight = weighted ? weightKg : null;
      const cartItem =
        data.items.find((row) => row.item_id === id && row.weight_kg === expectedWeight) ??
        data.items.find((row) => row.item_id === id);
      navigate("/checkout", {
        state: { itemIds: cartItem ? [cartItem.id] : [], recipeBundleIds: [] },
      });
    } catch {
      // toast already shown by addMutation.onError
    }
  }

  if (!marketId) {
    return (
      <EmptyState
        icon={<span className="text-5xl">🧺</span>}
        title="Choose a market first"
        description="Pick a market from Shop to see this product's price and availability."
        action={
          <Link to="/shop" className="text-sm font-semibold text-[#0097A7] hover:underline">
            Go to Shop
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !item) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-28 md:-mx-6 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 pb-2 pt-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 text-xs text-[#66777C]">
          <Link to="/shop" className="hover:text-[#0097A7]">
            Shop
          </Link>
          {item.category && (
            <>
              <span>/</span>
              <span className="text-[#66777C]">{item.category}</span>
            </>
          )}
          <span>/</span>
          <span className="font-medium text-[#203238]">{item.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[#DDE9EA] bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative bg-[#F7FAFA]">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-72 w-full object-cover md:h-full"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center text-[#DDE9EA] md:h-full">
                  <span className="text-6xl">🛒</span>
                </div>
              )}
              {item.is_muslim_friendly && (
                <span className="absolute left-4 top-4 rounded-full bg-[#0097A7] px-3 py-1 text-xs font-bold text-white">
                  Halal
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md md:hidden"
                aria-label="Go back"
              >
                <ArrowLeft size={18} className="text-[#203238]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col p-6 md:p-10">
              {item.category && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#0097A7]">
                  {item.category}
                </p>
              )}
              <h1 className="mb-2 font-display text-3xl font-bold text-[#203238]">
                {item.name}
              </h1>

              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-[#203238]">
                  {formatPeso(item.price)}
                </span>
                {item.unit && <span className="text-sm text-[#66777C]">per {item.unit}</span>}
              </div>

              {item.description && (
                <p className="mb-6 leading-relaxed text-[#66777C]">{item.description}</p>
              )}

              {item.is_cutoff && (
                <div className="mb-6 flex items-start gap-2 rounded-xl bg-[#E8F7F7] px-4 py-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-[#0097A7]" aria-hidden="true" />
                  <span className="text-sm font-medium text-[#0097A7]">
                    Past today&apos;s cutoff — add it now and it&apos;ll be delivered on the
                    next available slot.
                  </span>
                </div>
              )}

              {weighted && (
                <div className="mb-6">
                  <span className="mb-1.5 block text-sm font-medium text-[#203238]">
                    Weight
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {WEIGHT_PRESETS.map((preset) => (
                      <button
                        key={preset.kg}
                        type="button"
                        onClick={() => setWeightKg(preset.kg)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          weightKg === preset.kg
                            ? "border-transparent bg-[#0097A7] text-white"
                            : "border-[#DDE9EA] text-[#66777C] hover:border-[#0097A7]/50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 flex items-center gap-4">
                <span className="text-sm font-medium text-[#203238]">Quantity:</span>
                <div className="flex items-center gap-3 rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDE9EA] bg-white text-lg font-bold text-[#203238] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-[#203238]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0097A7] text-lg font-bold text-white transition-colors hover:bg-[#006D77]"
                  >
                    +
                  </button>
                </div>
              </div>

              <label className="mb-6 flex flex-col gap-1.5 text-sm font-medium text-[#203238]">
                Special instructions{" "}
                <span className="font-normal text-[#66777C]">(optional)</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Please choose ripe tomatoes."
                  className="resize-none rounded-xl border border-[#DDE9EA] bg-white p-3 text-sm font-normal text-[#203238] outline-none focus:border-[#0097A7]"
                />
              </label>

              <div className="mt-auto hidden gap-3 md:flex">
                <button
                  type="button"
                  disabled={addMutation.isPending}
                  onClick={() => void handleAddToCart()}
                  className="flex-1 rounded-xl border-2 border-[#0097A7] py-3.5 font-bold text-[#0097A7] transition-colors hover:bg-[#E8F7F7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  disabled={addMutation.isPending}
                  onClick={() => void handleBuyNow()}
                  className="flex-1 rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#006D77] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold text-[#203238]">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} item={p} onClick={() => navigate(`/product/${p.id}`)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DDE9EA] bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={addMutation.isPending}
            onClick={() => void handleAddToCart()}
            className="flex-1 rounded-xl border-2 border-[#0097A7] py-3 font-bold text-[#0097A7] transition-colors hover:bg-[#E8F7F7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={addMutation.isPending}
            onClick={() => void handleBuyNow()}
            className="flex-1 rounded-xl bg-[#0097A7] py-3 font-bold text-white transition-colors hover:bg-[#006D77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
