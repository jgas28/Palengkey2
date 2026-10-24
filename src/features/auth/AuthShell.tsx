import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Header";
import { photos } from "@/components/pk/photos";
import { usePkTheme } from "@/components/pk/usePkTheme";
import PkToast from "@/components/pk/PkToast";

/** The design's auth page — market photo with quote on the left, card on the right. */
export default function AuthShell({
  children,
  quote = "“Your trusted palengke, now closer to your home.”",
  homeHref = "/",
}: {
  children: ReactNode;
  /** Line shown over the photo (the admin login uses its own). */
  quote?: string;
  homeHref?: string;
}) {
  usePkTheme();

  return (
    <main className="auth-page">
      <section className="auth-photo">
        <img src={photos.palengke} alt="Fresh market produce and local shoppers" />
        <div>
          <Link to={homeHref} aria-label="Palengkey home">
            <Logo light />
          </Link>
          <blockquote>{quote}</blockquote>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
      {/* Auth pages sit outside the app layouts, so they show their own toasts
          (wrong password, Google errors, OTP sent…). */}
      <PkToast />
    </main>
  );
}
