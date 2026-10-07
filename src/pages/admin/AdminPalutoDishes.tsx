import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { listAdminPalutoDishes } from "@/services/api/adminPalutoDishes";
import { formatPeso } from "@/utils/currency";

/** One stall's own menu — every dish here has its own ingredient list and cooking fee. */
export default function AdminPalutoDishes() {
  const { stallId } = useParams<{ stallId: string }>();
  const id = Number(stallId);
  const [statusFilter, setStatusFilter] = useState<"" | "0" | "1">("");

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to="/admin/paluto-stalls" className="text-xs font-medium text-primary">
            ← Back to stalls
          </Link>
          <h1 className="text-lg font-semibold">
            {data ? `${data.stall.name} — Menu` : "Menu"}
          </h1>
          {data && (
            <p className="text-xs text-text-muted">
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
        className="h-10 self-start rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
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
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-text-muted">
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
                    <Link to={`/admin/paluto-stalls/${id}/dishes/${dish.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
