import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "solid" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // Admin surfaces only — keep the gradient look already approved there.
  primary:
    "bg-gradient-brand text-white shadow-soft hover:brightness-110 active:brightness-95",
  // Customer surfaces — flat brand color, minimal look.
  solid: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  ghost: "bg-transparent text-text hover:bg-primary-50",
  danger:
    "bg-gradient-to-br from-status-cancelled to-red-700 text-white shadow-soft hover:brightness-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
