import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Optional control (e.g. a show/hide password button) anchored inside the input's right edge. */
  rightElement?: ReactNode;
  /** Optional icon/control anchored inside the input's left edge. */
  leftElement?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, id, className = "", rightElement, leftElement, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`h-12 w-full rounded-xl border bg-surface px-4 text-base text-text placeholder:text-text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-background ${
              error ? "border-status-cancelled" : "border-border"
            } ${rightElement ? "pr-11" : ""} ${leftElement ? "pl-11" : ""} ${className}`}
            {...props}
          />
          {leftElement && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
              {leftElement}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-status-cancelled">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
