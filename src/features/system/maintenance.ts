/**
 * Maintenance mode hand-off between the API client and /maintenance.
 * Laravel answers every request with 503 during `php artisan down`; with
 * `--retry=<seconds>` it also sends Retry-After, which we turn into "back at".
 */
const KEY = "palengkey_maintenance";

interface MaintenanceInfo {
  /** Where the customer was, so "Check again" can take them back. */
  returnTo: string;
  /** Epoch ms the API said to retry at, if it told us. */
  retryAt: number | null;
}

/** Retry-After is either seconds or an HTTP date. */
function parseRetryAfter(value: string | null | undefined): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Date.now() + seconds * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : date;
}

export function rememberMaintenance(
  retryAfter?: string | null,
  backAt?: string | null,
  returnTo = window.location.pathname + window.location.search,
): void {
  const fromBody = backAt ? Date.parse(backAt) : NaN;
  const info: MaintenanceInfo = {
    returnTo,
    retryAt: Number.isNaN(fromBody) ? parseRetryAfter(retryAfter) : fromBody,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    // Private mode: the page still works, just without the return path/time.
  }
}

export function readMaintenance(): MaintenanceInfo {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MaintenanceInfo;
  } catch {
    // fall through
  }
  return { returnTo: "/", retryAt: null };
}

export function clearMaintenance(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Send the customer to /maintenance when the API is down for maintenance. */
export function goToMaintenance(
  retryAfter?: string | null,
  backAt?: string | null,
): void {
  const path = window.location.pathname;
  if (path.startsWith("/maintenance") || path.startsWith("/admin")) return;
  rememberMaintenance(retryAfter, backAt);
  window.location.assign("/maintenance");
}

/** "Today, 4:30 PM" / "Tomorrow, 9:00 AM" / "Oct 30, 9:00 AM" in Manila time. */
export function formatBackOnline(at: number): string {
  const tz = "Asia/Manila";
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: tz });
  const target = new Date(at);
  const today = day(new Date());
  const tomorrow = day(new Date(Date.now() + 86_400_000));
  const time = target.toLocaleTimeString("en-PH", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });
  if (day(target) === today) return `Today, ${time}`;
  if (day(target) === tomorrow) return `Tomorrow, ${time}`;
  return `${target.toLocaleDateString("en-PH", { timeZone: tz, month: "short", day: "numeric" })}, ${time}`;
}
