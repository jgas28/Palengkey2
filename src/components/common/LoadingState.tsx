export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary ${className}`}
    />
  );
}

/** Small spinner inside a button while it's working; takes the button's text color. */
export function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/** Palengkey logo inside a spinning ring. */
export function LogoLoader({ size = 72 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary" />
      <img
        src="/palengkey-loader.png"
        alt=""
        className="animate-pulse rounded-[22%]"
        style={{ width: size * 0.62, height: size * 0.62 }}
      />
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-primary-50 ${className}`}
    />
  );
}

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <LogoLoader />
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
