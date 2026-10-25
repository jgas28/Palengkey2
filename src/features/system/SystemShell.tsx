import type { ReactNode } from "react";
import Icon from "@/components/pk/Icon";
import { usePkTheme } from "@/components/pk/usePkTheme";

export const SUPPORT_EMAIL = "support@palengkey.ph";

/**
 * Frame shared by the maintenance, error and 404 pages (Figma "system pages"):
 * logo + "Need help?" header, the content, and a footnote. Standalone — no shop
 * header/footer — and uses plain links so it still works when the app around it
 * has crashed (it's also the ErrorBoundary fallback).
 */
export default function SystemShell({
  variant,
  footnote,
  footnoteIcon = "clock",
  children,
}: {
  variant: "maintenance-page" | "error-page" | "not-found-page";
  footnote?: ReactNode;
  footnoteIcon?: "clock" | "leaf";
  children: ReactNode;
}) {
  usePkTheme();

  return (
    <main className={`system-page ${variant}`}>
      <header className="system-header">
        <a className="system-logo" href="/" aria-label="Go to Palengkey home">
          <div className="logo">
            <img alt="PalengKey" src="/palengkey-logo.png" />
          </div>
        </a>
        <a className="system-help" href={`mailto:${SUPPORT_EMAIL}`}>
          <Icon name="message" size={17} /> Need help?
        </a>
      </header>
      <section className="system-content">{children}</section>
      {footnote && (
        <p className="system-footnote">
          <Icon name={footnoteIcon} size={14} /> {footnote}
        </p>
      )}
    </main>
  );
}
