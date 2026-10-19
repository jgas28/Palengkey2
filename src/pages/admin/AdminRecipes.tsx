import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import { listAdminRecipes } from "@/services/api/adminRecipes";
import { listAdminRecipeTypes } from "@/services/api/adminLookups";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageToolbar,
  PagerBar,
  manageSelect,
} from "@/components/admin/AdminManageList";

export default function AdminRecipes() {
  const navigate = useNavigate();
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
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Paluto & recipes"
        title="Recipes"
        description="Recipes customers can buy the raw ingredients for."
        actionLabel="Add recipe"
        onAction={() => navigate("/admin/recipes/new")}
      />

      <ManageToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search recipes"
      >
        <select
          aria-label="Recipe type"
          value={recipeTypeId ?? ""}
          onChange={(event) => {
            setRecipeTypeId(event.target.value ? Number(event.target.value) : undefined);
            setPage(1);
          }}
          className={manageSelect}
        >
          <option value="">All recipe types</option>
          {recipeTypes.map((recipeType) => (
            <option key={recipeType.id} value={recipeType.id}>
              {recipeType.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as "" | "0" | "1");
            setPage(1);
          }}
          className={manageSelect}
        >
          <option value="">All statuses</option>
          <option value="1">Live</option>
          <option value="0">Deactivated</option>
        </select>
      </ManageToolbar>

      {isLoading && (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {recipesPage && recipesPage.data.length === 0 && (
        <Card>
          <EmptyPanel
            title={
              search || recipeTypeId || statusFilter
                ? "No recipes match."
                : "No recipes yet."
            }
            description="Add a recipe so customers can follow it and buy its ingredients."
          />
        </Card>
      )}

      {recipesPage && recipesPage.data.length > 0 && (
        <ManageList
          footer={
            <PagerBar
              page={recipesPage.current_page}
              lastPage={recipesPage.last_page}
              total={recipesPage.total}
              perPage={recipesPage.per_page}
              onPage={setPage}
            />
          }
        >
          {recipesPage.data.map((recipe) => (
            <ManageRow
              key={recipe.id}
              onOpen={() => navigate(`/admin/recipes/${recipe.id}/edit`)}
              dimmed={!recipe.status}
              leading={
                <ManageIcon icon={<BookOpen size={18} />} image={recipe.image_url} />
              }
              title={recipe.name}
              subtitle={`${recipe.recipe_type ?? "Untagged"} · priced per ${
                recipe.pricing_unit === "kg" ? "kg" : "serving"
              } · base ${Number(recipe.base_quantity)}`}
              pills={
                <ManagePill tone={recipe.status ? "active" : "muted"}>
                  {recipe.status ? "Live" : "Deactivated"}
                </ManagePill>
              }
            />
          ))}
        </ManageList>
      )}
    </div>
  );
}
