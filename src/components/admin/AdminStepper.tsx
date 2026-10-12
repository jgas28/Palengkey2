import type { ReactNode } from "react";

export interface AdminStep {
  id: number;
  title: string;
  hint: string;
}

export interface AdminStepperProps {
  steps: readonly AdminStep[];
  current: number;
  /** Steps that already have saved content get a ✓. */
  done?: Partial<Record<number, boolean>>;
  /** Steps that can't be opened yet (e.g. before a new record exists). */
  isLocked?: (stepId: number) => boolean;
  onSelect: (stepId: number) => void;
  label?: string;
  /** Smaller pills without hints, for steps inside a modal. */
  compact?: boolean;
}

/** Tab-style progress bar for multi-step admin forms (recipe, item, Paluto dish…). */
export default function AdminStepper({
  steps,
  current,
  done = {},
  isLocked = () => false,
  onSelect,
  label = "Form steps",
  compact = false,
}: AdminStepperProps) {
  if (compact) {
    return (
      <nav aria-label={label}>
        <ol className="flex items-center gap-1.5">
          {steps.map((item, index) => {
            const active = item.id === current;
            const complete = Boolean(done[item.id]) && !active;
            return (
              <li key={item.id} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked(item.id)}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "bg-primary text-white"
                      : "bg-background text-text-muted hover:text-text"
                  }`}
                >
                  <span>{complete ? "✓" : item.id}</span>
                  <span className="truncate">{item.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className="h-px w-2 shrink-0 bg-border" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label={label}>
      <ol
        className={`grid grid-cols-2 gap-2 ${steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}
      >
        {steps.map((item) => {
          const active = item.id === current;
          const complete = Boolean(done[item.id]) && !active;
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={isLocked(item.id)}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(item.id)}
                className={`flex h-full w-full items-start gap-2.5 rounded-card border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-primary bg-primary-50"
                    : "border-border bg-surface hover:border-primary-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    complete
                      ? "bg-status-delivered text-white"
                      : active
                        ? "bg-primary text-white"
                        : "bg-background text-text-muted"
                  }`}
                >
                  {complete ? "✓" : item.id}
                </span>
                <span className="flex flex-col">
                  <span
                    className={`text-sm font-semibold ${active ? "text-primary-700" : "text-text"}`}
                  >
                    {item.title}
                  </span>
                  <span className="text-xs text-text-muted">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Card wrapper for one wizard step: title, optional intro, body and a Back/Next footer. */
export function AdminStepCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {intro && <p className="text-sm text-text-muted">{intro}</p>}
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        {footer}
      </div>
    </div>
  );
}

/** Page header for admin create/edit forms: back arrow, title and a Live/Deactivated pill. */
export function AdminFormHeader({
  title,
  onBack,
  backLabel,
  subtitle,
  status,
  statusLabels = ["Live", "Deactivated"],
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
  subtitle?: string;
  /** Omit for a record that doesn't exist yet. */
  status?: boolean;
  statusLabels?: [string, string];
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="text-text-muted"
        >
          ←
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {status !== undefined && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            status
              ? "bg-primary-50 text-status-delivered"
              : "bg-background text-text-muted"
          }`}
        >
          {status ? statusLabels[0] : statusLabels[1]}
        </span>
      )}
    </div>
  );
}
