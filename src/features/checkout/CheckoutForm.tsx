import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import AddressPickerDrawer from "@/features/addresses/AddressPickerDrawer";
import VoucherListDrawer from "@/features/checkout/VoucherListDrawer";
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
  icon: string;
}[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    hint: "Pay in cash when your order arrives",
    icon: "💵",
  },
  {
    value: "qrph",
    label: "QR Ph",
    hint: "Scan a QR code to pay instantly",
    icon: "📱",
  },
  { value: "bpi", label: "BPI", hint: "Pay via BPI online banking", icon: "🏦" },
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
  const [voucherCode, setVoucherCode] = useState("");
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
  const estimatedTotal = subtotal + deliveryFeeGross + (serviceFee ?? 0) - discountAmount;

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

      if (response.bpi) {
        navigate(`/checkout/bpi/${response.order.id}`, {
          state: { redirectUrl: response.bpi.redirect_url },
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
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/cart" className="text-[#66777C] hover:text-[#203238]">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#203238]">Checkout</h1>
      </div>

      {/* Steps */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= stepIndex ? "bg-[#0097A7] text-white" : "bg-[#DDE9EA] text-[#66777C]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm font-medium capitalize sm:block ${
                step === s ? "text-[#0097A7]" : "text-[#66777C]"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="h-0.5 w-8 bg-[#DDE9EA]" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-[#DDE9EA] bg-white p-6">
            {step === "details" && (
              <div className="space-y-4">
                <h2 className="mb-4 font-semibold text-[#203238]">Delivery Details</h2>

                {selectedAddress ? (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#DDE9EA] p-4 text-left transition-colors hover:border-[#0097A7]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#203238]">
                        {selectedAddress.label}
                      </p>
                      <p className="mt-0.5 text-sm text-[#66777C]">
                        {selectedAddress.contact_name} · {selectedAddress.contact_phone}
                      </p>
                      <p className="mt-0.5 text-sm text-[#66777C]">
                        {selectedAddress.address}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-[#0097A7]">Change</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-full rounded-xl border-2 border-dashed border-[#DDE9EA] p-4 text-sm font-semibold text-[#0097A7] transition-colors hover:border-[#0097A7]"
                  >
                    + Add delivery address
                  </button>
                )}

                {hasCutoffItems && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#203238]">
                      Delivery Schedule
                    </label>
                    <p className="mb-2 text-xs text-[#66777C]">
                      Some items are past today&apos;s cutoff — choose tomorrow&apos;s
                      delivery slot.
                    </p>
                    <select
                      value={orderLaterSlot}
                      onChange={(event) => setOrderLaterSlot(event.target.value)}
                      className="w-full rounded-xl border border-[#DDE9EA] bg-white px-4 py-3 text-sm text-[#203238] outline-none focus:border-[#0097A7]"
                    >
                      {ORDER_LATER_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#203238]">
                    Special Instructions{" "}
                    <span className="font-normal text-[#66777C]">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Gate code, landmark, or any delivery notes..."
                    className="w-full resize-none rounded-xl border border-[#DDE9EA] bg-white px-4 py-3 text-sm text-[#203238] outline-none focus:border-[#0097A7]"
                  />
                </div>

                <button
                  type="button"
                  disabled={!selectedAddress}
                  onClick={() => setStep("payment")}
                  className="w-full rounded-xl bg-[#0097A7] py-3.5 font-bold text-white transition-colors hover:bg-[#006D77] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <h2 className="mb-4 font-semibold text-[#203238]">Payment Method</h2>
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors ${
                      paymentMethod === method.value
                        ? "border-[#0097A7] bg-[#E8F7F7]"
                        : "border-[#DDE9EA] hover:border-[#0097A7]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl" aria-hidden="true">
                      {method.icon}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-[#203238]">{method.label}</span>
                      <span className="block text-xs text-[#66777C]">{method.hint}</span>
                    </span>
                    {paymentMethod === method.value && (
                      <Check size={20} className="text-[#0097A7]" aria-hidden="true" />
                    )}
                  </label>
                ))}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="flex-1 rounded-xl border-2 border-[#DDE9EA] py-3.5 font-bold text-[#66777C] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    className="flex-1 rounded-xl bg-[#0097A7] py-3.5 font-bold text-white transition-colors hover:bg-[#006D77]"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <h2 className="mb-4 font-semibold text-[#203238]">Review Your Order</h2>
                <div className="space-y-2 rounded-xl bg-[#F7FAFA] p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#66777C]">Name</span>
                    <span className="font-medium text-[#203238]">
                      {selectedAddress?.contact_name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0 text-[#66777C]">Address</span>
                    <span className="max-w-[60%] text-right font-medium text-[#203238]">
                      {selectedAddress?.address ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#66777C]">Payment</span>
                    <span className="font-medium text-[#203238]">
                      {selectedPaymentMethod.label}
                    </span>
                  </div>
                  {hasCutoffItems && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#66777C]">Delivery</span>
                      <span className="font-medium text-[#203238]">
                        Order Later — {orderLaterLabel}
                      </span>
                    </div>
                  )}
                  {notes && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="shrink-0 text-[#66777C]">Notes</span>
                      <span className="max-w-[60%] text-right font-medium text-[#203238]">
                        {notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("payment")}
                    className="flex-1 rounded-xl border-2 border-[#DDE9EA] py-3.5 font-bold text-[#66777C] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => checkoutMutation.mutate()}
                    className="flex-1 rounded-xl bg-[#159447] py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#087443] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutMutation.isPending ? "Placing order…" : "Confirm Order ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-[#DDE9EA] bg-white p-5">
            <h3 className="mb-3 font-semibold text-[#203238]">Order Summary</h3>
            <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F7FAFA]">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#203238]">{item.name}</p>
                    <p className="text-xs text-[#66777C]">×{item.item_quantity}</p>
                  </div>
                  <span className="shrink-0 font-medium text-[#203238]">
                    {formatPeso(Number(item.subtotal))}
                  </span>
                </div>
              ))}
              {selectedBundles.map((bundle) => (
                <div key={`bundle-${bundle.id}`} className="flex items-center gap-2 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F7FAFA]">
                    {bundle.image && (
                      <img
                        src={bundle.image}
                        alt={bundle.recipe_name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#203238]">{bundle.recipe_name}</p>
                    <p className="truncate text-xs text-[#66777C]">
                      {bundle.stall_name ? `Paluto at ${bundle.stall_name}` : "Ingredients only"}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-[#203238]">
                    {formatPeso(Number(bundle.subtotal))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-3 border-t border-[#DDE9EA] pt-3">
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value)}
                  placeholder="Voucher code"
                  className="h-9 flex-1 rounded-lg border border-[#DDE9EA] px-3 text-xs text-[#203238] outline-none focus:border-[#0097A7]"
                />
                <button
                  type="button"
                  onClick={() => voucherMutation.mutate(voucherCode)}
                  disabled={!voucherCode.trim() || voucherMutation.isPending}
                  className="shrink-0 px-2 text-xs font-bold text-[#0097A7] disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              <button
                type="button"
                onClick={() => setVoucherListOpen(true)}
                className="mt-1 text-xs font-semibold text-[#0097A7] hover:underline"
              >
                Browse available vouchers
              </button>
              {appliedVoucher && (
                <p className="mt-1 text-xs font-semibold text-[#159447]">
                  ✓ {appliedVoucher.code} applied — you save {formatPeso(discountAmount)}
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-[#DDE9EA] pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#66777C]">Subtotal</span>
                <span className="text-[#203238]">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66777C]">Service fee</span>
                {serviceFee === null ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <span className="text-[#203238]">{formatPeso(serviceFee)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-[#66777C]">Delivery fee</span>
                {deliveryFeeLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <span className="text-[#203238]">{formatPeso(deliveryNet)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-[#66777C]">VAT</span>
                <span className="text-[#203238]">{formatPeso(deliveryVat)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#159447]">
                  <span>Voucher discount</span>
                  <span>-{formatPeso(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#DDE9EA] pt-2 font-bold">
                <span className="text-[#203238]">Total</span>
                <span className="text-lg text-[#203238]">{formatPeso(estimatedTotal)}</span>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
