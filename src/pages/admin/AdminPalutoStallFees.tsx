import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import {
  getAdminPalutoStallFees,
  updateAdminPalutoStallFees,
  type PalutoStallRecipeFeeUpdate,
} from "@/services/api/adminPalutoStalls";
import { useToastStore } from "@/stores/toastStore";
import type { AdminPalutoStallRecipeFee } from "@/types/adminPalutoStall";

export default function AdminPalutoStallFees() {
  const { stallId } = useParams<{ stallId: string }>();
  const id = Number(stallId);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [edits, setEdits] = useState<Record<number, PalutoStallRecipeFeeUpdate>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminPalutoStallFees", id],
    queryFn: () => getAdminPalutoStallFees(id),
    enabled: Number.isFinite(id),
  });

  function rowFor(fee: AdminPalutoStallRecipeFee): PalutoStallRecipeFeeUpdate {
    return (
      edits[fee.recipe_id] ?? {
        recipe_id: fee.recipe_id,
        offered: fee.offered,
        rate: fee.rate ? Number(fee.rate) : null,
        minimum_fee: fee.minimum_fee ? Number(fee.minimum_fee) : null,
        status: fee.status,
        provided_ingredient_ids: fee.provided_ingredient_ids,
      }
    );
  }

  function toggleProvidedIngredient(fee: AdminPalutoStallRecipeFee, ingredientId: number) {
    const current = rowFor(fee);
    const has = current.provided_ingredient_ids.includes(ingredientId);
    updateRow(fee, {
      provided_ingredient_ids: has
        ? current.provided_ingredient_ids.filter((id) => id !== ingredientId)
        : [...current.provided_ingredient_ids, ingredientId],
    });
  }

  function updateRow(fee: AdminPalutoStallRecipeFee, patch: Partial<PalutoStallRecipeFeeUpdate>) {
    setEdits((prev) => ({ ...prev, [fee.recipe_id]: { ...rowFor(fee), ...patch } }));
  }

  const saveMutation = useMutation({
    mutationFn: () => updateAdminPalutoStallFees(id, Object.values(edits)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoStallFees", id] });
      setEdits({});
      showToast("Fees saved.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not save fees.", "error");
    },
  });

  function toggleAllOffered() {
    if (!data || data.length === 0) return;
    const allOffered = data.every((fee) => rowFor(fee).offered);
    setEdits((prev) => {
      const next = { ...prev };
      for (const fee of data) {
        next[fee.recipe_id] = { ...rowFor(fee), offered: !allOffered };
      }
      return next;
    });
  }

  function toggleAllStatus() {
    if (!data || data.length === 0) return;
    const allActive = data.every((fee) => rowFor(fee).status);
    setEdits((prev) => {
      const next = { ...prev };
      for (const fee of data) {
        next[fee.recipe_id] = { ...rowFor(fee), status: !allActive };
      }
      return next;
    });
  }

  const changedCount = Object.keys(edits).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to="/admin/paluto-stalls" className="text-xs font-medium text-primary">
            ← Back to stalls
          </Link>
          <h1 className="text-lg font-semibold">Cooking fees</h1>
        </div>
        <Button
          loading={saveMutation.isPending}
          disabled={changedCount === 0}
          onClick={() => saveMutation.mutate()}
        >
          Save changes {changedCount > 0 && `(${changedCount})`}
        </Button>
      </div>

      <p className="text-sm text-text-muted">
        Toggle which recipes this stall offers, and set the cooking fee rate (per the
        recipe&apos;s pricing unit) plus an optional minimum fee.
      </p>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No active recipes yet."
          description="Add recipes in the Recipes CMS before setting a stall's fees."
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Recipe</th>
                <th className="px-4 py-3">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={data.every((fee) => rowFor(fee).offered)}
                      onChange={toggleAllOffered}
                      className="h-4 w-4 rounded border-border"
                      aria-label="Toggle offered for all recipes"
                    />
                    Offered
                  </label>
                </th>
                <th className="px-4 py-3">Rate (₱)</th>
                <th className="px-4 py-3">Minimum fee (₱)</th>
                <th className="px-4 py-3">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={data.every((fee) => rowFor(fee).status)}
                      onChange={toggleAllStatus}
                      className="h-4 w-4 rounded border-border"
                      aria-label="Toggle active status for all recipes"
                    />
                    Status
                  </label>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((fee) => {
                const current = rowFor(fee);
                const isDirty = Boolean(edits[fee.recipe_id]);
                return (
                  <Fragment key={fee.recipe_id}>
                  <tr className={isDirty ? "bg-primary-50" : undefined}>
                    <td className="px-4 py-2 font-medium text-text">
                      {fee.recipe_name}
                      <span className="ml-2 text-xs text-text-muted">
                        per {fee.pricing_unit}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={current.offered}
                        onChange={(e) => updateRow(fee, { offered: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={current.rate ?? ""}
                        onChange={(e) =>
                          updateRow(fee, {
                            rate: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={current.minimum_fee ?? ""}
                        onChange={(e) =>
                          updateRow(fee, {
                            minimum_fee: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-9 w-28 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={current.status ? "1" : "0"}
                        onChange={(e) => updateRow(fee, { status: e.target.value === "1" })}
                        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </td>
                  </tr>
                  {current.offered && fee.ingredients.length > 0 && (
                    <tr className={isDirty ? "bg-primary-50" : undefined}>
                      <td colSpan={5} className="px-4 pb-3 pt-0">
                        <p className="mb-1.5 text-xs font-medium text-text-muted">
                          Already provided by this stall (skipped when this stall cooks the
                          order):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fee.ingredients.map((ingredient) => {
                            const checked = current.provided_ingredient_ids.includes(
                              ingredient.id,
                            );
                            return (
                              <label
                                key={ingredient.id}
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                                  checked
                                    ? "border-primary bg-primary-50 text-primary-700"
                                    : "border-border text-text-muted"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleProvidedIngredient(fee, ingredient.id)}
                                  className="h-3.5 w-3.5 rounded border-border"
                                />
                                {ingredient.item_name}
                                <span className="text-[10px] uppercase text-text-muted">
                                  {ingredient.kind}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
