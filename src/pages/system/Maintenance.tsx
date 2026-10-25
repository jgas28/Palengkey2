import { useState } from "react";
import Icon from "@/components/pk/Icon";
import { env } from "@/config/env";
import SystemShell, { SUPPORT_EMAIL } from "@/features/system/SystemShell";
import {
  clearMaintenance,
  formatBackOnline,
  readMaintenance,
  rememberMaintenance,
} from "@/features/system/maintenance";

/** Shown while the API is in maintenance mode (503). Figma: /maintenance. */
export default function Maintenance() {
  const [info, setInfo] = useState(readMaintenance);
  const [checking, setChecking] = useState(false);
  const [stillDown, setStillDown] = useState(false);

  async function checkAgain() {
    setChecking(true);
    setStillDown(false);
    try {
      const response = await fetch(`${env.apiUrl}/customer/categories`, {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        clearMaintenance();
        window.location.assign(info.returnTo || "/");
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        back_at?: string;
      } | null;
      rememberMaintenance(
        response.headers.get("Retry-After"),
        body?.back_at,
        info.returnTo,
      );
      setInfo(readMaintenance());
      setStillDown(true);
    } catch {
      setStillDown(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <SystemShell variant="maintenance-page">
      <div className="system-copy">
        <p className="system-kicker">
          <span /> Scheduled maintenance
        </p>
        <h1>Sandali lang, mga suki.</h1>
        <p>
          We’re giving Palengkey a quick tune-up so your next market run feels even
          fresher. We’ll be back shortly.
        </p>
        <div className="maintenance-window">
          <span>
            <Icon name="clock" />
          </span>
          <div>
            <small>Expected back online</small>
            <strong>{info.retryAt ? formatBackOnline(info.retryAt) : "Very soon"}</strong>
            <p>
              {stillDown
                ? "Still finishing up — please check again in a few minutes."
                : "Your basket and account details are safe."}
            </p>
          </div>
        </div>
        <div className="system-actions">
          <button
            type="button"
            className="btn primary"
            disabled={checking}
            onClick={() => void checkAgain()}
          >
            {checking ? "Checking…" : "Check again"} <Icon name="arrow" />
          </button>
          <a className="text-action" href={`mailto:${SUPPORT_EMAIL}`}>
            <Icon name="message" size={17} /> Contact support
          </a>
        </div>
      </div>
      <div className="system-art maintenance-art" aria-hidden="true">
        <div className="art-sun" />
        <div className="market-stall">
          <div className="stall-awning">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="stall-sign">
            <Icon name="sparkle" size={18} />
            <span>Fresh updates in progress</span>
          </div>
          <div className="produce-crate crate-one">
            <span />
            <span />
            <span />
          </div>
          <div className="produce-crate crate-two">
            <span />
            <span />
            <span />
          </div>
          <div className="stall-counter" />
        </div>
        <span className="art-leaf leaf-one">
          <Icon name="leaf" />
        </span>
        <span className="art-leaf leaf-two">
          <Icon name="leaf" />
        </span>
      </div>
    </SystemShell>
  );
}
