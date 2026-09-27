import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { getActivePopupAds } from "@/services/api/popupAds";
import { useAuthStore } from "@/stores/authStore";

const SESSION_KEY = "palengkey_popup_ads_seen";
const AUTO_ADVANCE_MS = 6000;
const OPEN_DELAY_MS = 900;

export default function PopupAdModal() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: ads = [] } = useQuery({
    queryKey: ["popupAds"],
    queryFn: getActivePopupAds,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const signature = ads.map((ad) => `${ad.id}-${ad.updated_at ?? ""}`).join("|");

  useEffect(() => {
    if (ads.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY) === signature) return;

    const timeout = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    if (!isOpen || ads.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % ads.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [isOpen, ads.length]);

  function close() {
    setIsOpen(false);
    sessionStorage.setItem(SESSION_KEY, signature);
  }

  function handleVoucherCta() {
    close();
    if (isAuthenticated) {
      navigate("/vouchers");
    } else {
      navigate("/login", { state: { from: { pathname: "/vouchers" } } });
    }
  }

  useFocusTrap(containerRef, isOpen, close);

  if (!isOpen || ads.length === 0) return null;

  const ad = ads[activeIndex];

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 px-4 py-6">
      <div aria-hidden="true" onClick={close} className="absolute inset-0" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ad.title}
        tabIndex={-1}
        className="relative w-full max-w-3xl overflow-hidden rounded-card bg-surface shadow-2xl focus:outline-none"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text shadow"
        >
          ✕
        </button>

        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="min-h-[240px] bg-background">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="h-full min-h-[240px] w-full object-cover"
            />
          </div>

          <div className="flex min-h-[260px] flex-col justify-center p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                {ad.badge_text || ad.type_label}
              </span>
              {ad.voucher && (
                <span className="rounded-pill bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">
                  {ad.voucher.code}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-extrabold leading-tight text-text sm:text-3xl">
              {ad.title}
            </h2>

            {ad.subtitle && (
              <p className="mt-2 text-base font-semibold text-text">{ad.subtitle}</p>
            )}

            {ad.body && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-muted">
                {ad.body}
              </p>
            )}

            {ad.voucher ? (
              <button
                type="button"
                onClick={handleVoucherCta}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-primary-500 px-5 py-3 text-sm font-bold text-white shadow-soft hover:brightness-110"
              >
                {ad.cta_label || "View voucher"} →
              </button>
            ) : (
              ad.cta_label &&
              ad.cta_url && (
                <a
                  href={ad.cta_url}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-primary-500 px-5 py-3 text-sm font-bold text-white shadow-soft hover:brightness-110"
                >
                  {ad.cta_label} →
                </a>
              )
            )}
          </div>
        </div>

        {ads.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {ads.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show promo ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${
                  index === activeIndex ? "bg-primary" : "bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
