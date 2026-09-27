import { formatPeso } from "@/utils/currency";

type Size = "sm" | "md" | "lg";

export interface PriceDisplayProps {
  amount: number;
  unit?: string;
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "text-sm font-bold",
  md: "text-base font-bold",
  lg: "text-2xl font-extrabold tracking-tight",
};

export default function PriceDisplay({
  amount,
  unit,
  size = "md",
  className = "",
}: PriceDisplayProps) {
  return (
    <span className={`text-primary-700 ${sizeClasses[size]} ${className}`}>
      {formatPeso(amount)}
      {unit && <span className="text-xs font-medium text-text-muted"> / {unit}</span>}
    </span>
  );
}
