import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Copy, Check, Percent, Tag } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { listVouchers } from "@/services/api/vouchers";
import { useToastStore } from "@/stores/toastStore";
import { useMarketStore } from "@/stores/marketStore";
import type { Voucher } from "@/types/voucher";

const TYPE_STYLE: Record<
  Voucher["discount_type"],
  { accent: string; strip: string; icon: typeof Percent }
> = {
  percentage: { accent: "#0097A7", strip: "bg-[#0097A7]", icon: Percent },
  fixed: { accent: "#F0A500", strip: "bg-[#F0A500]", icon: Tag },
};

function discountLabel(voucher: Voucher): string {
  return voucher.discount_type === "percentage"
    ? `${voucher.discount_value}% OFF`
    : `₱${voucher.discount_value} OFF`;
}

export default function Vouchers() {
  const showToast = useToastStore((state) => state.showToast);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const {
    data: vouchers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["vouchers", selectedMarket?.id],
    queryFn: () => listVouchers(selectedMarket?.id),
  });

  async function copyCode(voucher: Voucher) {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopiedId(voucher.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast("Code copied.", "success");
    } catch {
      showToast(voucher.code, "info");
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-full bg-[#F7FAFA] pb-10 md:-mx-6">
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-[#DDE9EA] bg-white lg:top-[calc(5rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] text-[#66777C] transition-colors hover:text-[#203238]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-[#203238]">
              Vouchers &amp; Promos
            </h1>
            <p className="text-xs text-[#66777C]">
              {vouchers?.length ?? 0} voucher{vouchers?.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {isError && <ErrorState onRetry={() => void refetch()} />}

        {!isLoading && !isError && vouchers?.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F7F7]">
              <Tag className="h-8 w-8 text-[#0097A7]" aria-hidden="true" />
            </div>
            <p className="mb-1 font-semibold text-[#203238]">No vouchers available</p>
            <p className="text-sm text-[#66777C]">Check back for promos and special offers.</p>
          </div>
        )}

        {vouchers && vouchers.length > 0 && (
          <div className="space-y-3">
            {vouchers.map((voucher) => {
              const style = TYPE_STYLE[voucher.discount_type];
              const Icon = style.icon;
              return (
                <div
                  key={voucher.id}
                  className="overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white shadow-sm"
                >
                  <div className="flex">
                    <div className={`w-2 shrink-0 ${style.strip}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span
                            className="mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{ background: `${style.accent}18`, color: style.accent }}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {discountLabel(voucher)}
                          </span>
                          {voucher.description && (
                            <p className="mt-1 text-xs leading-relaxed text-[#66777C]">
                              {voucher.description}
                            </p>
                          )}
                          {voucher.applies_to_label && (
                            <p className="mt-1 text-xs font-medium text-[#203238]">
                              {voucher.applies_to_label}
                            </p>
                          )}
                          {voucher.min_order_amount && (
                            <p className="mt-1 text-[10px] text-[#66777C]">
                              Min. spend ₱{voucher.min_order_amount}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyCode(voucher)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DDE9EA] text-[#66777C] transition-all hover:border-[#0097A7] hover:text-[#0097A7] active:scale-95"
                        >
                          {copiedId === voucher.id ? (
                            <Check className="h-4 w-4 text-[#159447]" aria-hidden="true" />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#DDE9EA] pt-3">
                        {voucher.expires_at ? (
                          <div className="flex items-center gap-1 text-[#66777C]">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span className="text-[11px]">Expires {voucher.expires_at}</span>
                          </div>
                        ) : (
                          <span />
                        )}
                        <span
                          className="font-mono text-xs font-bold tracking-widest"
                          style={{ color: style.accent }}
                        >
                          {voucher.code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-[#66777C]">
          Enter a code at checkout to apply it to your order.
        </p>
      </div>
    </div>
  );
}
