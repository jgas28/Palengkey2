import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
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
import { calculateServiceFee } from "@/utils/serviceFee";
import CartBulkBanner from "@/features/bulk/CartBulkBanner";
import { isOrderable } from "@/types/cart";

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
    const validIds = new Set(cart.items.filter(isOrderable).map((item) => item.id));
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
    const validBundleIds = new Set(
      (cart.recipe_bundles ?? []).map((bundle) => bundle.id),
    );
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
      showToast(
        error instanceof Error ? error.message : "Could not clear cart.",
        "error",
      );
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
      selectedIds.size === cart.items.filter(isOrderable).length &&
      selectedBundleIds.size === bundles.length;
    setSelectedIds(
      fullySelected
        ? new Set()
        : new Set(cart.items.filter(isOrderable).map((i) => i.id)),
    );
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
        if (bundle.ingredients.some((ingredient) => ingredient.is_cutoff))
          next.delete(bundle.id);
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

  const recipeBundles = cart?.recipe_bundles ?? [];
  const isEmpty = !cart || (cart.items.length === 0 && recipeBundles.length === 0);
  const hasCutoffItems =
    !!cart &&
    (cart.items.some((item) => item.is_cutoff) ||
      recipeBundles.some((bundle) =>
        bundle.ingredients.some((ingredient) => ingredient.is_cutoff),
      ));
  const unavailableCount = cart?.items.filter((item) => !isOrderable(item)).length ?? 0;
  const allSelected =
    !!cart &&
    selectedIds.size === cart.items.length - unavailableCount &&
    selectedBundleIds.size === recipeBundles.length;
  const totalSelectedCount = selectedIds.size + selectedBundleIds.size;
  const serviceFee =
    settings && totalSelectedCount > 0 ? calculateServiceFee(selectedTotal, settings) : 0;
  const amountToMinimum = settings ? settings.minimum_order_amount - selectedTotal : 0;

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title">
        <p className="kicker">
          {selectedMarket ? (
            <button
              type="button"
              onClick={() => setMarketPickerOpen(true)}
              style={{
                padding: 0,
                color: "inherit",
                background: "none",
                border: 0,
                font: "inherit",
                letterSpacing: "inherit",
              }}
            >
              {selectedMarket.name} · Change
            </button>
          ) : (
            "Your palengke"
          )}
        </p>
        <h1>Your market basket</h1>
        <p>Fresh items reserved once you proceed to checkout.</p>
      </div>

      <div className="shell cart-layout">
        <section className="cart-list">
          {isLoading ? (
            <div className="empty" style={{ margin: 18 }}>
              <Icon name="bag" size={34} />
              <h3>Loading your basket…</h3>
            </div>
          ) : isError ? (
            <div className="empty" style={{ margin: 18 }}>
              <Icon name="x" size={34} />
              <h3>Something went wrong</h3>
              <p>Please try again.</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => void refetch()}
              >
                Try again
              </button>
            </div>
          ) : isEmpty ? (
            <div className="empty" style={{ margin: 18 }}>
              <Icon name="bag" size={34} />
              <h3>Your basket is empty</h3>
              <p>Fresh finds are waiting at the market.</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate("/shop")}
              >
                Start shopping
              </button>
            </div>
          ) : (
            <>
              <div className={`notice ${hasCutoffItems ? "cutoff-reached" : ""}`}>
                <Icon name="clock" />
                <div>
                  <strong>
                    {hasCutoffItems
                      ? "Some items are past today’s cutoff"
                      : "Order before the market cutoff"}
                  </strong>
                  <p>
                    {hasCutoffItems
                      ? "No worries — choose a delivery slot for them at checkout, or leave them out of this order."
                      : "For same-day delivery from your selected market."}
                  </p>
                  {hasCutoffItems && (
                    <button
                      type="button"
                      onClick={excludeCutoffItems}
                      style={{
                        marginTop: 6,
                        padding: 0,
                        color: "inherit",
                        background: "none",
                        border: 0,
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration: "underline",
                      }}
                    >
                      Leave them out of this order
                    </button>
                  )}
                </div>
                {hasCutoffItems && <span>Order later</span>}
              </div>

              {unavailableCount > 0 && (
                <div className="notice cutoff-reached">
                  <Icon name="x" />
                  <div>
                    <strong>
                      {unavailableCount === 1
                        ? "1 item is no longer available"
                        : `${unavailableCount} items are no longer available`}
                    </strong>
                    <p>
                      The market marked them out of stock. They’re left out of your order
                      — remove them or check back later.
                    </p>
                  </div>
                </div>
              )}

              {cart?.bulk && (
                <div style={{ margin: "0 0 0" }}>
                  <CartBulkBanner bulk={cart.bulk} />
                </div>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--line)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  style={{ width: 16, height: 16, accentColor: "var(--teal)" }}
                />
                Select all ({(cart?.items.length ?? 0) + recipeBundles.length})
              </label>

              {cart?.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                />
              ))}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="continue-link"
              onClick={() => navigate("/shop")}
            >
              <Icon name="arrow" size={17} /> Continue shopping
            </button>
            {!isEmpty && (
              <button
                type="button"
                className="continue-link"
                style={{ color: "#b13c3c" }}
                disabled={clearMutation.isPending}
                onClick={handleClear}
              >
                {clearMutation.isPending ? "Clearing…" : "Clear basket"}
              </button>
            )}
          </div>
        </section>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <div>
            <span>Subtotal ({totalSelectedCount} selected)</span>
            <strong>{formatPeso(selectedTotal)}</strong>
          </div>
          <div>
            <span>Service fee</span>
            <strong>{formatPeso(serviceFee)}</strong>
          </div>
          <div>
            <span>Delivery fee</span>
            <small>Calculated at checkout</small>
          </div>
          <hr />
          <div className="summary-total">
            <span>Estimated total</span>
            <strong>{formatPeso(selectedTotal + serviceFee)}</strong>
          </div>
          <button
            type="button"
            className="btn primary checkout-button"
            disabled={totalSelectedCount === 0}
            onClick={handleCheckout}
          >
            {!isAuthenticated
              ? "Log in to checkout"
              : hasCutoffItems
                ? "Schedule order"
                : "Proceed to checkout"}{" "}
            <Icon name="arrow" size={18} />
          </button>
          {settings && totalSelectedCount > 0 && amountToMinimum > 0 && (
            <div className="later-hint">
              <Icon name="sparkle" size={14} />
              <span>
                Add {formatPeso(amountToMinimum)} more to switch from the flat{" "}
                {formatPeso(settings.service_fee_fixed_amount)} fee to{" "}
                {settings.service_fee_percent}%.
              </span>
            </div>
          )}
          {hasCutoffItems && (
            <div className="later-hint">
              <Icon name="clock" size={14} />
              <span>Past-cutoff items go out on the next available delivery slot.</span>
            </div>
          )}
          <p>
            <Icon name="shield" size={14} /> Secure checkout and freshness guarantee
          </p>
        </aside>
      </div>

      <MarketPickerDrawer
        isOpen={marketPickerOpen}
        onClose={() => setMarketPickerOpen(false)}
      />
    </main>
  );
}
