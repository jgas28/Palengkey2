import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import AddressPickerDrawer from "@/features/addresses/AddressPickerDrawer";
import CheckoutRouteMap from "@/features/checkout/CheckoutRouteMap";
import VoucherListDrawer from "@/features/checkout/VoucherListDrawer";
import { readPendingVoucher } from "@/features/checkout/pendingVoucher";
import { useCart, cartQueryKey } from "@/features/cart/useCart";
import { listAddresses } from "@/services/api/addresses";
import { getDeliveryFee, checkout } from "@/services/api/checkout";
import { validateVoucher } from "@/services/api/vouchers";
import { getSettings } from "@/services/api/settings";
import { useToastStore } from "@/stores/toastStore";
import { calculateDeliveryVat, calculateServiceFee } from "@/utils/serviceFee";
import { formatPeso } from "@/utils/currency";
import { ORDER_LATER_SLOTS, type CheckoutPaymentMethod } from "@/types/checkout";
import type { Address } from "@/types/address";
import type { VoucherValidation } from "@/types/voucher";

interface LocationState {
  itemIds?: number[];
  recipeBundleIds?: number[];
}

type Step = "details" | "payment" | "confirm";
const STEPS: Step[] = ["details", "payment", "confirm"];

const PAYMENT_METHODS: {
  value: CheckoutPaymentMethod;
  label: string;
  hint: string;
  /** Short mark in the design's payment badge. */
  badge: string;
}[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    hint: "Pay in cash when your order arrives",
    badge: "COD",
  },
  {
    value: "qrph",
    label: "QR Ph",
    hint: "Scan a QR code to pay instantly",
    badge: "QR",
  },
  {
    value: "gcash",
    label: "GCash",
    hint: "Pay with your GCash wallet",
    badge: "GC",
  },
  {
    value: "maya",
    label: "Maya",
    hint: "Pay with your Maya wallet",
    badge: "MY",
  },
  {
    value: "card",
    label: "Visa / Mastercard",
    hint: "Credit or debit card, secured by PayMongo",
    badge: "VM",
  },
  { value: "bpi", label: "BPI", hint: "Pay via BPI online banking", badge: "BPI" },
  {
    value: "ubp",
    label: "UnionBank",
    hint: "Pay via UnionBank online banking",
    badge: "UB",
  },
];

export default function CheckoutForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const itemIds = useMemo(
    () => (location.state as LocationState | null)?.itemIds ?? [],
    [location.state],
  );
  const recipeBundleIds = useMemo(
    () => (location.state as LocationState | null)?.recipeBundleIds ?? [],
    [location.state],
  );

  const { data: cart } = useCart();
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 60 * 60 * 1000,
  });

  const [step, setStep] = useState<Step>("details");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voucherListOpen, setVoucherListOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [voucherCode, setVoucherCode] = useState(readPendingVoucher);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidation | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderLaterSlot, setOrderLaterSlot] = useState<string>(
    ORDER_LATER_SLOTS[0].value,
  );
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!selectedAddress && addresses && addresses.length > 0) {
      setSelectedAddress(addresses.find((address) => address.is_default) ?? addresses[0]);
    }
  }, [addresses, selectedAddress]);

  const selectedItems = useMemo(
    () => cart?.items.filter((item) => itemIds.includes(item.id)) ?? [],
    [cart, itemIds],
  );

  const selectedBundles = useMemo(
    () => cart?.recipe_bundles?.filter((bundle) => recipeBundleIds.includes(bundle.id)) ?? [],
    [cart, recipeBundleIds],
  );

  useEffect(() => {
    if (itemIds.length === 0 && recipeBundleIds.length === 0) {
      navigate("/cart", { replace: true });
      return;
    }
    // Once the cart has loaded, the ids passed in via navigation state may no
    // longer exist (removed in another tab/session) — bail out rather than
    // letting checkout proceed with an empty, ₱0 selection.
    if (cart && selectedItems.length === 0 && selectedBundles.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [itemIds, recipeBundleIds, cart, selectedItems, selectedBundles, navigate]);

  const subtotal = useMemo(() => {
    const itemsSubtotal = selectedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const bundlesSubtotal = selectedBundles.reduce(
      (sum, bundle) => sum + Number(bundle.subtotal),
      0,
    );
    return itemsSubtotal + bundlesSubtotal;
  }, [selectedItems, selectedBundles]);

  const marketId = cart?.market_id;

  const { data: deliveryFee, isLoading: deliveryFeeLoading } = useQuery({
    queryKey: ["deliveryFee", marketId, selectedAddress?.id],
    queryFn: () =>
      getDeliveryFee({
        lat: selectedAddress!.latitude,
        lng: selectedAddress!.longitude,
        marketId: marketId!,
      }),
    enabled: Boolean(selectedAddress && marketId),
  });

  const hasCutoffItems =
    selectedItems.some((item) => item.is_cutoff) ||
    selectedBundles.some((bundle) =>
      bundle.ingredients.some((ingredient) => ingredient.is_cutoff),
    );

  const deliveryFeeGross = deliveryFee?.fee ?? 0;
  const deliveryVat = calculateDeliveryVat(deliveryFeeGross);
  const deliveryNet = deliveryFeeGross - deliveryVat;
  const serviceFee = settings ? calculateServiceFee(subtotal, settings) : null;
  // BULK-FREESHIP: mirrors BulkPricing::deliverySubsidy — min(delivery fee, cap)
  // when any line being checked out is at the bulk tier. Checkout re-checks it.
  const bulkActive = selectedItems.some((item) => item.is_bulk);
  const bulkVoucherCode = cart?.bulk?.voucher_code ?? "BULK-FREESHIP-49";
  const bulkDeliverySubsidy = bulkActive
    ? Math.min(deliveryFeeGross, Number(cart?.bulk?.delivery_subsidy_cap ?? 0))
    : 0;
  const estimatedTotal =
    subtotal + deliveryFeeGross + (serviceFee ?? 0) - discountAmount - bulkDeliverySubsidy;

  const voucherMutation = useMutation({
    mutationFn: (code: string) =>
      validateVoucher(code.trim().toUpperCase(), subtotal, marketId ?? undefined),
    onSuccess: ({ voucher, discount_amount }) => {
      setAppliedVoucher(voucher);
      setDiscountAmount(discount_amount);
      showToast("Voucher applied", "success");
    },
    onError: (error) => {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      showToast(error instanceof Error ? error.message : "Invalid voucher.", "error");
    },
  });

  function handleSelectVoucher(code: string) {
    setVoucherCode(code);
    voucherMutation.mutate(code);
  }

  const checkoutMutation = useMutation({
    mutationFn: () =>
      checkout({
        address_id: selectedAddress!.id,
        payment_method: paymentMethod,
        item_ids: itemIds,
        recipe_bundle_ids: recipeBundleIds,
        voucher_code: appliedVoucher?.code,
        order_later_slot: hasCutoffItems ? orderLaterSlot : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });

      if (response.qrph) {
        navigate(`/checkout/qrph/${response.order.id}`, {
          state: { qrUrl: response.qrph.qr_url },
          replace: true,
        });
        return;
      }

      const redirectUrl = response.payment_redirect?.redirect_url ?? response.bpi?.redirect_url;
      if (redirectUrl) {
        navigate(`/checkout/pay/${response.order.id}`, {
          state: { redirectUrl },
          replace: true,
        });
        return;
      }

      navigate(`/checkout/confirmation/${response.order.id}`, {
        state: { order: response.order },
        replace: true,
      });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Checkout failed.", "error");
    },
  });

  if (itemIds.length === 0 && recipeBundleIds.length === 0) return null;
  if (cart && selectedItems.length === 0 && selectedBundles.length === 0) return null;

  const stepIndex = STEPS.indexOf(step);
  const orderLaterLabel = ORDER_LATER_SLOTS.find((s) => s.value === orderLaterSlot)?.label;
  const selectedPaymentMethod = PAYMENT_METHODS.find((m) => m.value === paymentMethod)!;
  const canSubmit = !checkoutMutation.isPending && serviceFee !== null && !deliveryFeeLoading;

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title compact">
        <p className="kicker">
          <Link to="/cart">← Back to basket</Link> · Secure checkout
        </p>
        <h1>Complete your order</h1>
      </div>

      <div className="shell checkout-progress">
        {["Details", "Payment", "Confirm"].map((label, index) => (
          <div className={stepIndex >= index ? "active" : ""} key={label}>
            <span>{stepIndex > index ? <Icon name="check" size={15} /> : index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      <div className="shell checkout-layout">
        <section className="checkout-card">
          {step === "details" && (
            <div>
              <p className="kicker">Delivery details</p>
              <h2>Where should we deliver?</h2>

              {selectedAddress ? (
                <div className="address-choice">
                  <span>
                    <Icon name="truck" />
                  </span>
                  <div>
                    <strong>
                      {selectedAddress.label}
                      {selectedAddress.is_default && (
                        <small
                          style={{ marginLeft: 8, padding: "3px 7px", color: "#176b3a", background: "#e7f6ec", borderRadius: 999, fontSize: 8, textTransform: "uppercase" }}
                        >
                          Default
                        </small>
                      )}
                    </strong>
                    <p>{selectedAddress.address}</p>
                    <small>
                      {selectedAddress.contact_name} · {selectedAddress.contact_phone}
                    </small>
                  </div>
                  <button type="button" onClick={() => setPickerOpen(true)}>
                    Change
                  </button>
                </div>
              ) : (
                <div className="address-choice">
                  <span>
                    <Icon name="plus" />
                  </span>
                  <div>
                    <strong>No delivery address yet</strong>
                    <p>Add where we should bring your market goods.</p>
                  </div>
                  <button type="button" onClick={() => setPickerOpen(true)}>
                    Add
                  </button>
                </div>
              )}

              {selectedAddress &&
                deliveryFee?.market_latitude != null &&
                deliveryFee.market_longitude != null && (
                  <CheckoutRouteMap
                    market={{
                      lat: Number(deliveryFee.market_latitude),
                      lng: Number(deliveryFee.market_longitude),
                      name: deliveryFee.market_name ?? "Market",
                    }}
                    destination={{
                      lat: Number(selectedAddress.latitude),
                      lng: Number(selectedAddress.longitude),
                      label: selectedAddress.label,
                    }}
                    distanceKm={deliveryFee.distance_km}
                    etaMin={deliveryFee.eta_min}
                    etaMax={deliveryFee.eta_max}
                  />
                )}

              {hasCutoffItems && (
                <div className="checkout-cutoff">
                  <Icon name="clock" />
                  <div>
                    <strong>Same-day ordering is closed for some items</strong>
                    <p>They&apos;re past the market cutoff — choose a delivery slot for the next market run.</p>
                  </div>
                </div>
              )}

              <div className="delivery-timing">
                <strong>When would you like your order?</strong>
                <div>
                  {!hasCutoffItems && (
                    <button type="button" className="active">
                      <Icon name="truck" />
                      <span>
                        <strong>Deliver today</strong>
                        <small>Shopped and delivered from the market today</small>
                      </span>
                    </button>
                  )}
                  {hasCutoffItems && (
                    <button type="button" className="active">
                      <Icon name="clock" />
                      <span>
                        <strong>Order later</strong>
                        <small>Next available market run</small>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {hasCutoffItems && (
                <div className="slot-picker">
                  <label>
                    Delivery date
                    <select disabled value="next">
                      <option value="next">Next available day</option>
                    </select>
                  </label>
                  <div>
                    <strong>Available time slots</strong>
                    <section>
                      {ORDER_LATER_SLOTS.map((slot) => (
                        <button
                          type="button"
                          className={orderLaterSlot === slot.value ? "active" : ""}
                          onClick={() => setOrderLaterSlot(slot.value)}
                          key={slot.value}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </section>
                  </div>
                </div>
              )}

              <label>
                Delivery instructions
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  placeholder="Landmark, gate color, or instructions for your rider"
                />
              </label>
              <button
                type="button"
                className="btn primary next-button"
                disabled={!selectedAddress}
                onClick={() => setStep("payment")}
              >
                Continue to payment <Icon name="arrow" />
              </button>
            </div>
          )}

          {step === "payment" && (
            <div>
              <p className="kicker">Payment</p>
              <h2>Choose a payment method</h2>
              <div className="payment-list">
                {PAYMENT_METHODS.map((method) => (
                  <label className={paymentMethod === method.value ? "selected" : ""} key={method.value}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    <span>{method.badge}</span>
                    <strong>{method.label}</strong>
                    <small>{method.hint}</small>
                  </label>
                ))}
              </div>
              <div className="step-actions">
                <button type="button" className="btn outline" onClick={() => setStep("details")}>
                  Back
                </button>
                <button type="button" className="btn primary" onClick={() => setStep("confirm")}>
                  Review order <Icon name="arrow" />
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div>
              <p className="kicker">Review and confirm</p>
              <h2>Everything looks fresh.</h2>
              <div className="review-block">
                <div>
                  <span>Deliver to</span>
                  <strong>{selectedAddress?.contact_name ?? "—"}</strong>
                  <p>{selectedAddress?.address ?? "—"}</p>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{selectedPaymentMethod.label}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>{hasCutoffItems ? `Next available day, ${orderLaterLabel}` : "Today"}</strong>
                  {hasCutoffItems && <p>Scheduled Order Later delivery</p>}
                </div>
                {notes && (
                  <div>
                    <span>Instructions</span>
                    <p>{notes}</p>
                  </div>
                )}
              </div>
              <div className="step-actions">
                <button type="button" className="btn outline" onClick={() => setStep("payment")}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn confirm-button"
                  disabled={!canSubmit}
                  onClick={() => checkoutMutation.mutate()}
                >
                  <Icon name="check" /> {checkoutMutation.isPending ? "Placing order…" : "Confirm order"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="order-summary checkout-summary">
          <h2>Your order</h2>
          {selectedItems.map((item) => (
            <div className="mini-line" key={item.id}>
              <span>
                {item.item_quantity}× {item.name}
                {item.is_bulk ? " · Bulk" : ""}
              </span>
              <strong>{formatPeso(Number(item.subtotal))}</strong>
            </div>
          ))}
          {selectedBundles.map((bundle) => (
            <div className="mini-line" key={`bundle-${bundle.id}`}>
              <span>
                {bundle.recipe_name}
                {bundle.stall_name ? ` · Paluto at ${bundle.stall_name}` : " · Ingredients"}
              </span>
              <strong>{formatPeso(Number(bundle.subtotal))}</strong>
            </div>
          ))}

          <div style={{ display: "block" }}>
            <div className="voucher-input" style={{ margin: "6px 0 4px", maxWidth: "none" }}>
              <Icon name="sparkle" />
              <input
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value)}
                placeholder="Voucher code"
                aria-label="Voucher code"
              />
              <button
                type="button"
                className="btn primary"
                style={{ minHeight: 34, padding: "0 12px", fontSize: 10 }}
                disabled={!voucherCode.trim() || voucherMutation.isPending}
                onClick={() => voucherMutation.mutate(voucherCode)}
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={() => setVoucherListOpen(true)}
              style={{ padding: 0, color: "var(--teal-dark)", background: "none", border: 0, fontSize: 10, fontWeight: 700 }}
            >
              Browse available vouchers
            </button>
            {appliedVoucher && (
              <p style={{ margin: "6px 0 0", color: "#16a34a", fontSize: 10, fontWeight: 700 }}>
                ✓ {appliedVoucher.code} applied — you save {formatPeso(discountAmount)}
              </p>
            )}
          </div>
          <hr />
          <div>
            <span>Subtotal</span>
            <strong>{formatPeso(subtotal)}</strong>
          </div>
          <div>
            <span>Service fee</span>
            <strong>{serviceFee === null ? "…" : formatPeso(serviceFee)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{deliveryFeeLoading ? "…" : formatPeso(deliveryNet)}</strong>
          </div>
          <div>
            <span>VAT (delivery)</span>
            <strong>{formatPeso(deliveryVat)}</strong>
          </div>
          {bulkDeliverySubsidy > 0 && (
            <div style={{ color: "#16a34a" }}>
              <span>Bulk delivery subsidy ({bulkVoucherCode})</span>
              <strong>-{formatPeso(bulkDeliverySubsidy)}</strong>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ color: "#16a34a" }}>
              <span>Voucher discount</span>
              <strong>-{formatPeso(discountAmount)}</strong>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPeso(estimatedTotal)}</strong>
          </div>
        </aside>
      </div>

      <AddressPickerDrawer
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedAddressId={selectedAddress?.id ?? null}
        onSelect={setSelectedAddress}
      />
      <VoucherListDrawer
        isOpen={voucherListOpen}
        onClose={() => setVoucherListOpen(false)}
        onSelect={handleSelectVoucher}
        marketId={marketId ?? undefined}
      />
    </main>
  );
}
