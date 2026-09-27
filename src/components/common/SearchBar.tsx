import type { InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search products",
  className = "",
  ...props
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden="true"
        size={20}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-pill border border-border bg-surface pl-11 pr-11 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-background"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
