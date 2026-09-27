import { Minus, Plus } from "lucide-react";

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  label = "Quantity",
}: QuantitySelectorProps) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-pill border border-border bg-background p-1"
    >
      <button
        type="button"
        onClick={decrease}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text shadow-soft transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span
        className="min-w-6 text-center text-base font-bold text-text"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-soft transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
