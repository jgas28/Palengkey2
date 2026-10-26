import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { getActivePopupAds } from "@/services/api/popupAds";
import { useAuthStore } from "@/stores/authStore";
import { sanitizeRichText } from "@/utils/safeHtml";

const SESSION_KEY = "palengkey_popup_ads_seen";
const AUTO_ADVANCE_MS = 6000;
const OPEN_DELAY_MS = 900;
/** Popups greet visitors on the homepage only. */
const POPUP_PATHS = ["/"];

export default function PopupAdModal() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onHomepage = POPUP_PATHS.includes(pathname);

  const { data: ads = [] } = useQuery({
    queryKey: ["popupAds"],
    queryFn: getActivePopupAds,
    enabled: onHomepage,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seen once per browser session; a new or edited ad changes the signature and shows again.
  const signature = ads.map((ad) => `${ad.id}-${ad.updated_at ?? ""}`).join("|");

  useEffect(() => {
    if (!onHomepage || ads.length === 0) return;
    let seen: string | null = null;
    try {
      seen = sessionStorage.getItem(SESSION_KEY);
    } catch {
      seen = null;
    }
    if (seen === signature) return;

    const timeout = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, onHomepage]);

  // Leaving the homepage closes it.
  useEffect(() => {
    if (!onHomepage) setIsOpen(false);
  }, [onHomepage]);

  useEffect(() => {
    if (!isOpen || ads.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % ads.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [isOpen, ads.length]);

  function close() {
    setIsOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, signature);
    } catch {
      // Private mode: it just shows again next visit.
    }
  }

  function handleVoucherCta() {
    close();
    if (isAuthenticated) {
      navigate("/vouchers");
    } else {
      navigate("/login", { state: { from: { pathname: "/vouchers" } } });
    }
  }

  function handleLinkCta(url: string) {
    close();
    if (url.startsWith("/")) navigate(url);
    else window.location.href = url;
  }

  useFocusTrap(containerRef, isOpen, close);

  if (!onHomepage || !isOpen || ads.length === 0) return null;

  const ad = ads[Math.min(activeIndex, ads.length - 1)];
  const ctaClass =
    "mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#0097a7] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#00838f]";

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#0b2a2e]/60 px-4 py-6 backdrop-blur-[2px]">
      <div aria-hidden="true" onClick={close} className="absolute inset-0" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ad.title}
        tabIndex={-1}
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl focus:outline-none"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-md hover:text-slate-900"
        >
          <Icon name="x" size={18} />
        </button>

        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[240px] bg-[#eaf4f2]">
            <img
              src={ad.image_url}
              alt=""
              className="h-full min-h-[240px] w-full object-cover md:min-h-[380px]"
            />
            {ad.voucher && (
              <span className="absolute bottom-4 left-4 rounded-full bg-[#f9a825] px-3 py-1.5 text-xs font-bold tracking-wide text-[#3b2600] shadow">
                {ad.voucher.code}
              </span>
            )}
          </div>

          <div className="flex min-h-[260px] flex-col justify-center p-6 sm:p-8">
            <span className="w-fit rounded-full bg-[#e0f4f5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00737e]">
              {ad.badge_text || ad.type_label}
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-slate-900">
              {ad.title}
            </h2>

            {ad.subtitle && (
              <p className="mt-2 text-base font-semibold text-[#00737e]">{ad.subtitle}</p>
            )}

            {ad.body && (
              <p
                className="mt-3 text-sm leading-6 text-slate-500 [&_b]:font-bold [&_b]:text-slate-800 [&_strong]:font-bold [&_strong]:text-slate-800 [&_i]:italic [&_em]:italic [&_u]:underline [&_u]:underline-offset-2"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(ad.body) }}
              />
            )}

            {ad.voucher ? (
              <button type="button" onClick={handleVoucherCta} className={ctaClass}>
                {ad.cta_label || "View voucher"} <Icon name="arrow" size={16} />
              </button>
            ) : (
              ad.cta_label &&
              ad.cta_url && (
                <button
                  type="button"
                  onClick={() => handleLinkCta(ad.cta_url!)}
                  className={ctaClass}
                >
                  {ad.cta_label} <Icon name="arrow" size={16} />
                </button>
              )
            )}

            <button
              type="button"
              onClick={close}
              className="mt-3 w-fit text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Maybe later
            </button>
          </div>
        </div>

        {ads.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 md:left-auto md:right-8 md:justify-end">
            {ads.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show promo ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-6 bg-[#0097a7]" : "w-2.5 bg-slate-300"
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
