import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { copyAdminPalutoDish, listAdminPalutoDishes } from "@/services/api/adminPalutoDishes";
import { listAdminPalutoStalls } from "@/services/api/adminPalutoStalls";
import CopyDialog from "@/features/admin/CopyDialog";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { AdminPalutoDishSummary } from "@/types/adminPalutoDish";
import type { AdminPalutoStall } from "@/types/adminPalutoStall";

/** Every stall (the list endpoint pages by 20), for the "copy to" picker. */
async function listAllStalls(): Promise<AdminPalutoStall[]> {
  const stalls: AdminPalutoStall[] = [];
  for (let page = 1; page <= 50; page++) {
    const result = await listAdminPalutoStalls({ page });
    stalls.push(...result.data);
    if (result.current_page >= result.last_page) break;
  }
  return stalls;
}

/** One stall's own menu — every dish here has its own ingredient list and cooking fee. */
export default function AdminPalutoDishes() {
  const { stallId } = useParams<{ stallId: string }>();
  const id = Number(stallId);
  const [statusFilter, setStatusFilter] = useState<"" | "0" | "1">("");
  const [copying, setCopying] = useState<AdminPalutoDishSummary | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: stalls = [] } = useQuery({
    queryKey: ["adminPalutoStallsAll"],
    queryFn: listAllStalls,
    enabled: copying !== null,
    staleTime: 60_000,
  });

  const copyMutation = useMutation({
    mutationFn: (vars: { dishId: number; targetStallId: number; name: string }) =>
      copyAdminPalutoDish(vars.dishId, { target_stall_id: vars.targetStallId, name: vars.name }),
    onSuccess: (copy) => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoDishes"] });
      setCopying(null);
      showToast(
        `Copied to ${copy.stall_name} as “${copy.name}”. It's deactivated until you turn it on.`,
        "success",
      );
      navigate(`/admin/paluto-stalls/${copy.paluto_stall_id}/dishes/${copy.id}/edit`);
    },
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "Could not copy the dish.", "error"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminPalutoDishes", id],
    queryFn: () => listAdminPalutoDishes(id),
    enabled: Number.isFinite(id),
  });

  const dishes = (data?.dishes ?? []).filter(
    (dish) => statusFilter === "" || dish.status === (statusFilter === "1"),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to="/admin/paluto-stalls" className="text-xs font-medium text-primary">
            ← Back to stalls
          </Link>
          <h2 className="font-display text-3xl font-semibold text-slate-900">
            {data ? `${data.stall.name} — Menu` : "Menu"}
          </h2>
          {data && (
            <p className="text-sm text-slate-500">
              {data.stall.market_name ?? "No market"} · ingredient prices come from this
              market
            </p>
          )}
        </div>
        <Link to={`/admin/paluto-stalls/${id}/dishes/new`}>
          <Button size="sm">Add dish</Button>
        </Link>
      </div>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as "" | "0" | "1")}
        aria-label="Filter by status"
        className="h-10 self-startrounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
      >
        <option value="">All statuses</option>
        <option value="1">Active</option>
        <option value="0">Deactivated</option>
      </select>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && dishes.length === 0 && (
        <EmptyState
          title="No dishes on this menu yet."
          description="Add a dish, then build its ingredient list from items sold at this stall's market."
        />
      )}

      {dishes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Dish</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Cooking fee</th>
                <th className="px-4 py-3">Ingredients</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dishes.map((dish) => (
                <tr key={dish.id}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                          {dish.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-text">{dish.name}</span>
                        {dish.recipe_type && (
                          <span className="text-xs text-text-muted">
                            {dish.recipe_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {Number(dish.base_quantity)} {dish.pricing_unit}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {formatPeso(Number(dish.rate))} / {dish.pricing_unit}
                    {dish.minimum_fee !== null && (
                      <span className="block text-xs">
                        min {formatPeso(Number(dish.minimum_fee))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {dish.ingredients_count === 0 ? (
                      <span className="font-semibold text-status-cancelled">
                        None yet
                      </span>
                    ) : (
                      dish.ingredients_count
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs font-semibold ${
                        dish.status ? "text-status-delivered" : "text-text-muted"
                      }`}
                    >
                      {dish.status ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setCopying(dish)}>
                        Copy
                      </Button>
                      <Link to={`/admin/paluto-stalls/${id}/dishes/${dish.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {copying && (
        <CopyDialog
          isOpen
          key={copying.id}
          title={`Copy “${copying.name}”`}
          initialName={copying.name}
          targets={stalls.map((stall) => ({
            id: stall.id,
            label: `${stall.name}${stall.market_name ? ` — ${stall.market_name}` : ""}${
              stall.id === id ? " (this stall)" : ""
            }${stall.status ? "" : " (deactivated)"}`,
          }))}
          initialTargetId={undefined}
          targetLabel="Copy to stall"
          isSaving={copyMutation.isPending}
          onClose={() => setCopying(null)}
          onCopy={(name, targetStallId) =>
            targetStallId !== undefined &&
            copyMutation.mutate({ dishId: copying.id, targetStallId, name })
          }
        />
      )}
    </div>
  );
}
