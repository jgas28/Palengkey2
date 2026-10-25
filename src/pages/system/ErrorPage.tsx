import { useMemo } from "react";
import Icon from "@/components/pk/Icon";
import SystemShell, { SUPPORT_EMAIL } from "@/features/system/SystemShell";
import { makeErrorReference } from "@/features/system/errorReference";

/**
 * "Naku, may aberya." — Figma /error. Also the ErrorBoundary fallback, so it uses
 * plain links/reloads rather than router navigation (the app may have crashed).
 */
export default function ErrorPage({
  code = 500,
  reference,
  onRetry,
}: {
  code?: number | string;
  reference?: string;
  onRetry?: () => void;
}) {
  const ref = useMemo(() => reference ?? makeErrorReference(code), [reference, code]);
  const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Palengkey error ${ref}`,
  )}&body=${encodeURIComponent(
    `Hi Palengkey team,\n\nI ran into an error (reference ${ref}) on ${window.location.href}.\n\nWhat I was doing:\n`,
  )}`;

  return (
    <SystemShell
      variant="error-page"
      footnote="If you have an active delivery, you can still reach us through Support."
    >
      <div className="system-copy">
        <p className="system-kicker error-kicker">
          <span /> Something went wrong
        </p>
        <h1>Naku, may aberya.</h1>
        <p>
          We couldn’t load this page right now. Your account and any orders you’ve placed
          are still safe.
        </p>
        <div className="system-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
          >
            Try again <Icon name="arrow" />
          </button>
          <a className="btn system-secondary" href="/">
            Back to home
          </a>
        </div>
        <p className="error-reference">
          Still not working? <a href={mail}>Tell our support team</a>
          <br />
          <small>Reference: {ref}</small>
        </p>
      </div>
      <div className="system-art error-art" aria-hidden="true">
        <span className="error-code">{code}</span>
        <div className="broken-basket">
          <span className="basket-handle" />
          <div className="basket-body">
            <i />
            <i />
            <i />
          </div>
          <span className="fallen-produce produce-one" />
          <span className="fallen-produce produce-two" />
          <span className="fallen-produce produce-three" />
        </div>
        <span className="error-spark spark-one">
          <Icon name="sparkle" />
        </span>
        <span className="error-spark spark-two">
          <Icon name="sparkle" />
        </span>
      </div>
    </SystemShell>
  );
}
