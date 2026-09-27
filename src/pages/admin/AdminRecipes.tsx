import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/5] w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {recipesPage && recipesPage.data.length === 0 && (
        <EmptyState
          title="No recipes yet."
          description="Add your first recipe to offer it as a cook-at-stall dish."
        />
      )}

      {recipesPage && recipesPage.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {recipesPage.data.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/admin/recipes/${recipe.id}/edit`}
                className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
              >
                <div className="relative">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-primary-50 text-2xl font-bold text-primary-700">
                      {recipe.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!recipe.status && (
                    <span className="absolute left-1 top-1 rounded-pill bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                      Deactivated
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <span className="line-clamp-2 text-sm font-medium text-text">
                    {recipe.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {recipe.recipe_type ?? "Untagged"}
                  </span>
                  <span className="text-xs font-semibold text-primary-700">
                    Per {recipe.pricing_unit} · base {recipe.base_quantity}
                  </span>
                </div>
              </Link>
            ))}
          </div>

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
