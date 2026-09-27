import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import {
  createAdminCuratedProduct,
  deleteAdminCuratedProduct,
  listAdminCuratedProducts,
  updateAdminCuratedProduct,
} from "@/services/api/adminCuratedProducts";
import { listAdminItems } from "@/services/api/adminItems";
import { useToastStore } from "@/stores/toastStore";
import type { CuratedSection } from "@/types/adminCuratedProduct";

const SECTIONS: { value: CuratedSection; label: string }[] = [
  { value: "highlighted_products", label: "Highlighted Products" },
  { value: "best_deals", label: "Today's Best Deals" },
];

export default function AdminHighlights() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [section, setSection] = useState<CuratedSection>("highlighted_products");
  const [search, setSearch] = useState("");

  const {
    data: curated = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminCuratedProducts", section],
    queryFn: () => listAdminCuratedProducts(section),
  });

  const curatedItemIds = useMemo(() => new Set(curated.map((c) => c.item.id)), [curated]);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["adminItemsSearch", search],
    queryFn: () => listAdminItems({ search, page: 1 }),
    enabled: search.trim().length > 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["adminCuratedProducts", section] });

  const addMutation = useMutation({
    mutationFn: (itemId: number) => createAdminCuratedProduct({ section, item_id: itemId }),
    onSuccess: () => {
      invalidate();
      showToast("Added.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add item.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; sort_order?: number; is_active?: boolean }) =>
      updateAdminCuratedProduct(vars.id, {
        sort_order: vars.sort_order,
        is_active: vars.is_active,
      }),
    onSuccess: invalidate,
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => deleteAdminCuratedProduct(id),
    onSuccess: () => {
      invalidate();
      showToast("Removed.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not remove item.", "error");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b border-border">
        {SECTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSection(value)}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              section === value
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text">Curated items</h2>

          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {isError && <ErrorState onRetry={() => void refetch()} />}

          {!isLoading && !isError && curated.length === 0 && (
            <EmptyState
              title="Nothing curated yet."
              description="Search for a product on the right and add it to this section."
            />
          )}

          {!isLoading && !isError && curated.length > 0 && (
            <ul className="flex flex-col gap-2">
              {curated.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-primary-50">
                    {entry.item.image && (
                      <img
                        src={entry.item.image}
                        alt={entry.item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{entry.item.name}</p>
                    {entry.item.category && (
                      <p className="text-xs text-text-muted">{entry.item.category}</p>
                    )}
                  </div>
                  <label className="flex flex-col items-center gap-1 text-xs text-text-muted">
                    Order
                    <input
                      type="number"
                      min={0}
                      defaultValue={entry.sort_order}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (value !== entry.sort_order) {
                          updateMutation.mutate({ id: entry.id, sort_order: value });
                        }
                      }}
                      className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-center text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </label>
                  <label className="flex flex-col items-center gap-1 text-xs text-text-muted">
                    Active
                    <input
                      type="checkbox"
                      checked={entry.is_active}
                      onChange={(e) =>
                        updateMutation.mutate({ id: entry.id, is_active: e.target.checked })
                      }
                      className="h-5 w-5 accent-primary"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={removeMutation.isPending && removeMutation.variables === entry.id}
                    onClick={() => removeMutation.mutate(entry.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text">Add a product</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
          />

          {searching && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {!searching && search.trim().length > 1 && searchResults?.data.length === 0 && (
            <p className="text-sm text-text-muted">No products found.</p>
          )}

          {!searching && searchResults && searchResults.data.length > 0 && (
            <ul className="flex flex-col gap-2">
              {searchResults.data.map((item) => {
                const alreadyAdded = curatedItemIds.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-card border border-border bg-surface p-2.5"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-primary-50">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm text-text">
                      {item.name}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={alreadyAdded}
                      loading={addMutation.isPending && addMutation.variables === item.id}
                      onClick={() => addMutation.mutate(item.id)}
                    >
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
