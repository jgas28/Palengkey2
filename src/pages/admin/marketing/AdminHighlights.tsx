import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminCuratedProduct,
  deleteAdminCuratedProduct,
  listAdminCuratedProducts,
  updateAdminCuratedProduct,
} from "@/services/api/adminCuratedProducts";
import { listAdminItems } from "@/services/api/adminItems";
import { useToastStore } from "@/stores/toastStore";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import { ManageTabs, PagerBar } from "@/components/admin/AdminManageList";
import usePagedRows from "@/hooks/usePagedRows";
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
  const paged = usePagedRows(curated, 8, section);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["adminItemsSearch", search],
    queryFn: () => listAdminItems({ search, page: 1 }),
    placeholderData: keepPreviousData,
    enabled: search.trim().length > 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["adminCuratedProducts", section] });

  const addMutation = useMutation({
    mutationFn: (itemId: number) =>
      createAdminCuratedProduct({ section, item_id: itemId }),
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
      showToast(
        error instanceof Error ? error.message : "Could not remove item.",
        "error",
      );
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <ManageTabs
        label="Section"
        tabs={SECTIONS.map(({ value, label }) => ({ value, label }))}
        value={section}
        onChange={setSection}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Curated items
            </h3>
            <p className="text-xs text-slate-500">
              Lower order numbers show first. Untick Active to hide without removing.
            </p>
          </div>

          {isLoading && <SkeletonRows rows={4} />}

          {isError && <ErrorState onRetry={() => void refetch()} />}

          {!isLoading && !isError && curated.length === 0 && (
            <EmptyPanel
              title="Nothing curated yet."
              description="Search for a product on the right and add it to this section."
            />
          )}

          {!isLoading && !isError && curated.length > 0 && (
            <>
              <ul className="divide-y divide-slate-100">
                {paged.rows.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary-50">
                      {entry.item.image && (
                        <img
                          src={entry.item.image}
                          alt={entry.item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {entry.item.name}
                      </p>
                      {entry.item.category && (
                        <p className="text-xs text-slate-500">{entry.item.category}</p>
                      )}
                    </div>
                    <label className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
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
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={entry.is_active}
                      aria-label={entry.is_active ? "Hide" : "Show"}
                      onClick={() =>
                        updateMutation.mutate({
                          id: entry.id,
                          is_active: !entry.is_active,
                        })
                      }
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        entry.is_active ? "bg-primary-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          entry.is_active ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      disabled={
                        removeMutation.isPending && removeMutation.variables === entry.id
                      }
                      onClick={() => removeMutation.mutate(entry.id)}
                      className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <PagerBar
                page={paged.page}
                lastPage={paged.lastPage}
                total={paged.total}
                perPage={paged.perPage}
                onPage={paged.setPage}
              />
            </>
          )}
        </Card>

        <Card className="flex h-fit flex-col gap-3 p-5">
          <h3 className="font-display text-lg font-semibold text-slate-900">
            Add a product
          </h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5"
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
        </Card>
      </div>
    </div>
  );
}
