import { useQuery } from "@tanstack/react-query";
import Drawer from "@/components/ui/Drawer";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listVouchers } from "@/services/api/vouchers";

export interface VoucherListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  marketId?: number;
}

function discountLabel(discountType: string, discountValue: number): string {
  return discountType === "percentage"
    ? `${discountValue}% off`
    : `₱${discountValue} off`;
}

export default function VoucherListDrawer({
  isOpen,
  onClose,
  onSelect,
  marketId,
}: VoucherListDrawerProps) {
  const {
    data: vouchers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["vouchers", marketId],
    queryFn: () => listVouchers(marketId),
    enabled: isOpen,
  });

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="bottom" title="Available vouchers">
      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && vouchers?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🎟️</span>}
          title="No vouchers available right now."
        />
      )}

      {!isLoading && !isError && vouchers && vouchers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {vouchers.map((voucher) => (
            <li key={voucher.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(voucher.code);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-card border border-dashed border-primary-200 bg-primary-50 p-3.5 text-left transition-colors active:scale-[0.99] md:hover:border-primary"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-soft"
                >
                  🎟️
                </span>
                <span className="flex flex-1 flex-col items-start gap-0.5">
                  <strong
                    className="text-base tracking-wide text-primary-700"
                    style={{ fontWeight: 800 }}
                  >
                    {voucher.code}
                  </strong>
                  {voucher.description && (
                    <span className="text-sm text-text-muted">{voucher.description}</span>
                  )}
                  <span className="text-xs font-medium text-text-muted">
                    {discountLabel(voucher.discount_type, voucher.discount_value)}
                    {voucher.min_order_amount &&
                      ` · min. order ₱${voucher.min_order_amount}`}
                    {voucher.expires_at && ` · expires ${voucher.expires_at}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
