import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminTable, {
  AdminStatusPill,
  AdminThumb,
  adminTd,
  adminTdStrong,
} from "@/components/admin/AdminTable";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listAdminRecipes } from "@/services/api/adminRecipes";
import { listAdminRecipeTypes } from "@/services/api/adminLookups";

export default function AdminRecipes() {
  const [search, setSearch] = useState("");
  const [recipeTypeId, setRecipeTypeId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"" | "0" | "1">("");
  const [page, setPage] = useState(1);

  const { data: recipeTypes = [] } = useQuery({
    queryKey: ["adminRecipeTypesLookup"],
    queryFn: listAdminRecipeTypes,
  });

  const {
    data: recipesPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminRecipes", search, recipeTypeId, statusFilter, page],
    queryFn: () =>
      listAdminRecipes({
        search: search || undefined,
        recipeTypeId,
        status: statusFilter || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Recipes</h1>
        <Link to="/admin/recipes/new">
          <Button size="sm">Add recipe</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search recipes…"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <select
          value={recipeTypeId ?? ""}
          onChange={(event) => {
            setRecipeTypeId(event.target.value ? Number(event.target.value) : undefined);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">All recipe types</option>
          {recipeTypes.map((recipeType) => (
            <option key={recipeType.id} value={recipeType.id}>
              {recipeType.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "" | "0" | "1");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Deactivated</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {recipesPage && recipesPage.data.length === 0 && (
        <EmptyState
          title="No recipes yet."
          description="Add your first recipe so customers can follow it and buy its ingredients."
        />
      )}

      {recipesPage && recipesPage.data.length > 0 && (
        <>
          <AdminTable head={["Recipe", "Type", "Priced per", "Status", ""]}>
            {recipesPage.data.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-background/60">
                <td className={adminTdStrong}>
                  <Link
                    to={`/admin/recipes/${recipe.id}/edit`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    <AdminThumb src={recipe.image_url} />
                    <span className="line-clamp-2">{recipe.name}</span>
                  </Link>
                </td>
                <td className={adminTd}>{recipe.recipe_type ?? "Untagged"}</td>
                <td className={adminTd}>
                  {recipe.pricing_unit === "kg" ? "kg" : "serving"} · base{" "}
                  {Number(recipe.base_quantity)}
                </td>
                <td className={adminTd}>
                  <AdminStatusPill
                    active={recipe.status}
                    activeLabel="Live"
                    inactiveLabel="Deactivated"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/recipes/${recipe.id}/edit`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTable>

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              Page {recipesPage.current_page} of {recipesPage.last_page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={recipesPage.current_page >= recipesPage.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
