import type { Category } from "@/types/category";
import type { ProductType } from "@/types/productType";

export interface FilterChipsProps {
  categories: Category[];
  types: ProductType[];
  activeCategoryId: number | null;
  activeTypeId: number | null;
  onCategoryChange: (id: number | null) => void;
  onTypeChange: (id: number | null) => void;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-pill border px-4 py-1.5 text-sm font-medium transition-all ${
        active
          ? "border-transparent bg-primary-500 text-white shadow-soft"
          : "border-border bg-surface text-text-muted hover:border-primary-300 hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterChips({
  categories,
  types,
  activeCategoryId,
  activeTypeId,
  onCategoryChange,
  onTypeChange,
}: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Chip
        label="All"
        active={activeCategoryId === null && activeTypeId === null}
        onClick={() => {
          onCategoryChange(null);
          onTypeChange(null);
        }}
      />
      {categories.map((category) => (
        <Chip
          key={`category-${category.id}`}
          label={category.name}
          active={activeCategoryId === category.id}
          onClick={() =>
            onCategoryChange(activeCategoryId === category.id ? null : category.id)
          }
        />
      ))}
      {types.map((type) => (
        <Chip
          key={`type-${type.id}`}
          label={type.name}
          active={activeTypeId === type.id}
          onClick={() => onTypeChange(activeTypeId === type.id ? null : type.id)}
        />
      ))}
    </div>
  );
}
