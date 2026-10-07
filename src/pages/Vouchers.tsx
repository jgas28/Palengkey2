import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { readPendingVoucher, savePendingVoucher } from "@/features/checkout/pendingVoucher";
import { listVouchers } from "@/services/api/vouchers";
import { useToastStore } from "@/stores/toastStore";
import { useMarketStore } from "@/stores/marketStore";
import type { Voucher } from "@/types/voucher";

const CARD_COLORS = ["teal", "amber", "dark"] as const;

function voucherTitle(voucher: Voucher): string {
  return voucher.discount_type === "percentage"
    ? `${voucher.discount_value}% off ${voucher.applies_to_label?.toLowerCase() ?? "your order"}`
    : `₱${voucher.discount_value} off ${voucher.applies_to_label?.toLowerCase() ?? "your market run"}`;
}

function voucherDetail(voucher: Voucher): string {
  const parts = [
    voucher.description,
    voucher.min_order_amount ? `Minimum spend of ₱${voucher.min_order_amount}` : null,
    voucher.max_discount_amount ? `Maximum discount of ₱${voucher.max_discount_amount}` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "Apply at checkout.";
}

/** The design's vouchers page — real vouchers; "Use voucher" pre-fills it at checkout. */
export default function Vouchers() {
  const showToast = useToastStore((state) => state.showToast);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [applied, setApplied] = useState(() => readPendingVoucher());
  const [code, setCode] = useState("");

  const { data: vouchers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["vouchers", selectedMarket?.id],
    queryFn: () => listVouchers(selectedMarket?.id),
  });

  function applyVoucher(voucherCode: string) {
    const normalized = voucherCode.trim().toUpperCase();
    if (!normalized) return;
    savePendingVoucher(normalized);
    setApplied(normalized);
    showToast(`${normalized} will be applied at checkout`, "success");
  }

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title">
        <p className="kicker">Suki rewards</p>
        <h1>Vouchers &amp; promos</h1>
        <p>Save more on your next market run.</p>
      </div>
      <section className="shell voucher-layout">
        <form
          className="voucher-input"
          onSubmit={(event) => {
            event.preventDefault();
            applyVoucher(code);
            setCode("");
          }}
        >
          <Icon name="sparkle" />
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter voucher code"
            aria-label="Voucher code"
          />
          <button type="submit" className="btn primary" disabled={!code.trim()}>
            Apply code
          </button>
        </form>

        {isLoading ? (
          <div className="empty">
            <Icon name="sparkle" size={34} />
            <h3>Loading vouchers…</h3>
          </div>
        ) : isError ? (
          <div className="empty">
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="empty">
            <Icon name="sparkle" size={34} />
            <h3>No vouchers right now</h3>
            <p>Check back for promos and special offers.</p>
          </div>
        ) : (
          <div className="voucher-grid">
            {vouchers.map((voucher, index) => (
              <article className={`voucher-card ${CARD_COLORS[index % CARD_COLORS.length]}`} key={voucher.id}>
                <div>
                  <span>
                    <Icon name="sparkle" />
                  </span>
                  <small>{voucher.expires_at ? `Valid until ${voucher.expires_at}` : "No expiry"}</small>
                </div>
                <h2>{voucherTitle(voucher)}</h2>
                <p>{voucherDetail(voucher)}</p>
                <div className="voucher-actions">
                  <code>{voucher.code}</code>
                  <button
                    type="button"
                    className={applied === voucher.code ? "applied" : ""}
                    onClick={() => applyVoucher(voucher.code)}
                  >
                    {applied === voucher.code ? "Applied" : "Use voucher"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="voucher-note">
          <Icon name="shield" />
          <p>Vouchers apply at checkout. Only one voucher can be used per order unless otherwise stated.</p>
        </div>
      </section>
    </main>
  );
}
