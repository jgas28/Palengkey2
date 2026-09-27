import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ShoppingBag, Store } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import CartItemRow from "@/features/cart/CartItemRow";
import CartRecipeBundleRow from "@/features/paluto/CartRecipeBundleRow";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { useCart, cartQueryKey } from "@/features/cart/useCart";
import { clearCart } from "@/services/api/cart";
import { getSettings } from "@/services/api/settings";
import { useToastStore } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { useMarketStore } from "@/stores/marketStore";
import { formatPeso } from "@/utils/currency";

export default function Cart() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 60 * 60 * 1000,
  });
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const seenIds = useRef<Set<number>>(new Set());
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<number>>(new Set());
  const seenBundleIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!cart) return;
    const validIds = new Set(cart.items.map((item) => item.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of validIds) {
        if (!seenIds.current.has(id)) next.add(id);
      }
      for (const id of next) {
        if (!validIds.has(id)) next.delete(id);
      }
      return next;
    });
    seenIds.current = validIds;
  }, [cart]);

  useEffect(() => {
    if (!cart) return;
    const validBundleIds = new Set((cart.recipe_bundles ?? []).map((bundle) => bundle.id));
    setSelectedBundleIds((prev) => {
      const next = new Set(prev);
      for (const id of validBundleIds) {
        if (!seenBundleIds.current.has(id)) next.add(id);
      }
      for (const id of next) {
        if (!validBundleIds.has(id)) next.delete(id);
      }
      return next;
    });
    seenBundleIds.current = validBundleIds;
  }, [cart]);

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast("Cart cleared", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not clear cart.", "error");
    },
  });

  function toggleSelect(itemId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (!cart) return;
    const bundles = cart.recipe_bundles ?? [];
    const fullySelected =
      selectedIds.size === cart.items.length && selectedBundleIds.size === bundles.length;
    setSelectedIds(fullySelected ? new Set() : new Set(cart.items.map((i) => i.id)));
    setSelectedBundleIds(fullySelected ? new Set() : new Set(bundles.map((b) => b.id)));
  }

  function toggleSelectBundle(bundleId: number) {
    setSelectedBundleIds((prev) => {
      const next = new Set(prev);
      if (next.has(bundleId)) {
        next.delete(bundleId);
      } else {
        next.add(bundleId);
      }
      return next;
    });
  }

  function handleClear() {
    if (window.confirm("Remove all items from your cart?")) {
      clearMutation.mutate();
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    navigate("/checkout", {
      state: { itemIds: [...selectedIds], recipeBundleIds: [...selectedBundleIds] },
    });
  }

  function excludeCutoffItems() {
    if (!cart) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of cart.items) {
        if (item.is_cutoff) next.delete(item.id);
      }
      return next;
    });
    setSelectedBundleIds((prev) => {
      const next = new Set(prev);
      for (const bundle of cart.recipe_bundles ?? []) {
        if (bundle.ingredients.some((ingredient) => ingredient.is_cutoff)) next.delete(bundle.id);
      }
      return next;
    });
  }

  const selectedTotal = useMemo(() => {
    if (!cart) return 0;
    const itemsTotal = cart.items
      .filter((item) => selectedIds.has(item.id))
      .reduce((sum, item) => sum + Number(item.subtotal), 0);
    const bundlesTotal = (cart.recipe_bundles ?? [])
      .filter((bundle) => selectedBundleIds.has(bundle.id))
      .reduce((sum, bundle) => sum + Number(bundle.subtotal), 0);
    return itemsTotal + bundlesTotal;
  }, [cart, selectedIds, selectedBundleIds]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F7FAFA] py-16">
        <div className="text-center">
          <p className="mb-2 font-semibold text-[#203238]">Something went wrong.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-semibold text-[#0097A7] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const recipeBundles = cart?.recipe_bundles ?? [];
  const totalLineCount = (cart?.items.length ?? 0) + recipeBundles.length;

  if (!cart || (cart.items.length === 0 && recipeBundles.length === 0)) {
    return (
      <div className="-mx-4 -mt-4 flex min-h-full items-center justify-center bg-[#F7FAFA] pb-24 md:-mx-6 md:pb-0">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F7F7] text-4xl">
            <ShoppingBag className="h-10 w-10 text-[#0097A7]" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-[#203238]">
            Your cart is empty
          </h2>
          <p className="mb-6 text-[#66777C]">Add some fresh groceries to get started.</p>
          <Link
            to="/shop"
            className="rounded-xl bg-[#0097A7] px-6 py-3 font-bold text-white transition-colors hover:bg-[#006D77]"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const hasCutoffItems =
    cart.items.some((item) => item.is_cutoff) ||
    recipeBundles.some((bundle) => bundle.ingredients.some((ingredient) => ingredient.is_cutoff));
  const allSelected =
    selectedIds.size === cart.items.length && selectedBundleIds.size === recipeBundles.length;
  const amountToMinimum = settings ? settings.minimum_order_amount - selectedTotal : 0;
  const totalSelectedCount = selectedIds.size + selectedBundleIds.size;

  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-28 md:-mx-6 md:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-display text-2xl font-bold text-[#203238]">
          Your Cart{" "}
          <span className="font-sans text-base font-normal text-[#66777C]">
            ({totalLineCount} {totalLineCount === 1 ? "item" : "items"})
          </span>
        </h1>

        {selectedMarket && (
          <button
            type="button"
            onClick={() => setMarketPickerOpen(true)}
            className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#DDE9EA] bg-white p-3.5 text-left transition-colors hover:border-[#0097A7]"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7F7] text-[#0097A7]">
                <Store size={18} aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wide text-[#66777C]">
                  Ordering from
                </span>
                <span className="text-sm font-semibold text-[#203238]">
                  {selectedMarket.name}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-[#0097A7]/30 px-3 py-1 text-xs font-semibold text-[#0097A7]">
              Change Market
            </span>
          </button>
        )}

        {hasCutoffItems && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-[#FFF9F0] p-3 text-sm text-[#B8860B]">
            <p className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Some items are past today&apos;s order cutoff and may not be included in this
              order.
            </p>
            <button
              type="button"
              onClick={excludeCutoffItems}
              className="self-start rounded-full border border-[#B8860B]/40 px-3 py-1 text-xs font-semibold text-[#B8860B]"
            >
              Exclude items from current order
            </button>
          </div>
        )}

        {settings && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-3 text-xs text-[#66777C]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-semibold text-[#203238]">
                <span>Convenience fee tier</span>
                <span>
                  {formatPeso(selectedTotal)} / {formatPeso(settings.minimum_order_amount)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DDE9EA]">
                <div
                  className="h-full rounded-full bg-[#0097A7] transition-all"
                  style={{
                    width: `${Math.min(100, (selectedTotal / Math.max(1, settings.minimum_order_amount)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {amountToMinimum > 0 ? (
              <p>
                Orders under {formatPeso(settings.minimum_order_amount)} include a flat{" "}
                {formatPeso(settings.service_fee_fixed_amount)} service fee. Add{" "}
                {formatPeso(amountToMinimum)} more for a lower, percentage-based fee instead.
              </p>
            ) : (
              <p>
                Service fee: {settings.service_fee_percent}% of subtotal (capped at{" "}
                {formatPeso(settings.service_fee_max_amount)}).
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#0097A7]/20 bg-[#E8F7F7] p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#0097A7]">
                Sign in to checkout faster
              </p>
              <p className="text-xs text-[#0097A7]/80">
                Access saved addresses, payment methods, and earn rewards on every order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login", { state: { from: { pathname: "/cart" } } })}
              className="shrink-0 rounded-xl bg-[#0097A7] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#006D77]"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Items */}
          <div className="space-y-3 md:col-span-2">
            {(cart.items.length > 0 || recipeBundles.length > 0) && (
              <label className="flex items-center gap-2 px-1 text-sm font-medium text-[#203238]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 accent-[#0097A7]"
                />
                Select all
              </label>
            )}

            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            ))}

            {recipeBundles.length > 0 && (
              <>
                <h2 className="pt-2 text-sm font-semibold text-[#203238]">Paluto orders</h2>
                {recipeBundles.map((bundle) => (
                  <CartRecipeBundleRow
                    key={bundle.id}
                    bundle={bundle}
                    selected={selectedBundleIds.has(bundle.id)}
                    onToggleSelect={() => toggleSelectBundle(bundle.id)}
                  />
                ))}
              </>
            )}

            <Link
              to="/shop"
              className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#0097A7] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="md:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[#DDE9EA] bg-white p-5">
              <h3 className="mb-4 font-semibold text-[#203238]">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#66777C]">
                    Subtotal ({totalSelectedCount} selected)
                  </span>
                  <span className="font-medium text-[#203238]">
                    {formatPeso(selectedTotal)}
                  </span>
                </div>
                <p className="text-xs text-[#66777C]">
                  Delivery fee &amp; taxes are calculated at checkout.
                </p>
                <div className="flex justify-between border-t border-[#DDE9EA] pt-3">
                  <span className="font-bold text-[#203238]">Total</span>
                  <span className="text-xl font-bold text-[#203238]">
                    {formatPeso(selectedTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={totalSelectedCount === 0}
                onClick={handleCheckout}
                className="mt-5 hidden w-full rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#006D77] disabled:cursor-not-allowed disabled:opacity-40 md:block"
              >
                {isAuthenticated ? "Proceed to Checkout" : "Sign in to Checkout"}
              </button>
              <button
                type="button"
                disabled={clearMutation.isPending}
                onClick={handleClear}
                className="mt-2 hidden w-full rounded-xl border border-[#DDE9EA] py-2.5 text-sm font-semibold text-[#66777C] transition-colors hover:border-[#F05A47] hover:text-[#F05A47] disabled:opacity-50 md:block"
              >
                {clearMutation.isPending ? "Clearing…" : "Clear cart"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#DDE9EA] bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[#66777C]">
            Total ({totalSelectedCount} selected)
          </span>
          <span className="text-lg font-bold text-[#203238]">{formatPeso(selectedTotal)}</span>
        </div>
        <button
          type="button"
          disabled={totalSelectedCount === 0}
          onClick={handleCheckout}
          className="w-full rounded-xl bg-[#0097A7] py-3.5 font-bold text-white transition-colors hover:bg-[#006D77] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAuthenticated ? "Proceed to Checkout" : "Sign in to Checkout"}
        </button>
      </div>

      <MarketPickerDrawer isOpen={marketPickerOpen} onClose={() => setMarketPickerOpen(false)} />
    </div>
  );
}
