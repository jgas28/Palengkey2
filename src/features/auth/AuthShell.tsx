import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Header";
import { photos } from "@/components/pk/photos";
import { usePkTheme } from "@/components/pk/usePkTheme";

/** The design's auth page — market photo with quote on the left, card on the right. */
export default function AuthShell({ children }: { children: ReactNode }) {
  usePkTheme();

  return (
    <main className="auth-page">
      <section className="auth-photo">
        <img src={photos.market} alt="Fresh market produce and local shoppers" />
        <div>
          <Link to="/" aria-label="Palengkey home">
            <Logo light />
          </Link>
          <blockquote>“Your trusted palengke, now closer to home.”</blockquote>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
