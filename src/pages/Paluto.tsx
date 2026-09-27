import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChefHat } from "lucide-react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SearchBar from "@/components/common/SearchBar";
import RecipeCard from "@/features/paluto/RecipeCard";
import RecipeDetailDrawer from "@/features/paluto/RecipeDetailDrawer";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { listRecipes, listRecipeTypes } from "@/services/api/paluto";
import { useMarketStore } from "@/stores/marketStore";

export default function Paluto() {
  const selectedMarket = useMarketStore((state) => state.selectedMarket);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeRecipeTypeId, setActiveRecipeTypeId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: recipeTypes = [] } = useQuery({
    queryKey: ["recipeTypes"],
    queryFn: listRecipeTypes,
  });

  const marketId = selectedMarket?.id;

  const {
    data: recipePages,
    isLoading: recipesLoading,
    isError: recipesError,
    refetch: refetchRecipes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["recipes", marketId, activeRecipeTypeId, debouncedSearch],
    queryFn: ({ pageParam }) =>
      listRecipes({
        marketId: marketId!,
        recipeTypeId: activeRecipeTypeId ?? undefined,
        search: debouncedSearch,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    enabled: marketId !== undefined,
  });

  const recipes = useMemo(
    () => recipePages?.pages.flatMap((page) => page.data) ?? [],
    [recipePages],
  );

  if (!selectedMarket) {
    return (
      <>
        <EmptyState
          icon={<ChefHat size={40} aria-hidden="true" />}
          title="Choose a market to see Paluto recipes"
          description="Pick your market and we'll show recipes available for cook-at-stall in it."
          action={
            <Button variant="solid" onClick={() => setPickerOpen(true)}>
              Choose market
            </Button>
          }
        />
        <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  return (
    <div className="-mx-4 -mt-4 flex flex-col gap-4 md:-mx-6">
      <div className="bg-gradient-to-br from-[#FFF9F0] via-[#E8F7F7] to-[#FFF9F0]">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <span className="mb-2 inline-block rounded-full bg-[#0097A7]/10 px-3 py-1 text-xs font-semibold text-[#0097A7]">
            Recipe Market
          </span>
          <h1 className="mb-1 font-display text-2xl font-bold text-[#203238]">Paluto</h1>
          <p className="max-w-lg text-sm leading-relaxed text-[#66777C]">
            Pick a Filipino recipe.{" "}
            <strong className="text-[#203238]">Cook it yourself</strong> with fresh ingredients
            delivered, see the <strong className="text-[#203238]">step-by-step guide</strong>, or
            let our <strong className="text-[#203238]">market stall cook it</strong> ready to eat.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
        <SearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="Search recipes"
          className="shadow-soft"
        />

        {recipeTypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveRecipeTypeId(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeRecipeTypeId === null
                  ? "bg-[#0097A7] text-white"
                  : "border border-[#DDE9EA] bg-white text-[#66777C] hover:border-[#0097A7]"
              }`}
            >
              All
            </button>
            {recipeTypes.map((recipeType) => (
              <button
                key={recipeType.id}
                type="button"
                onClick={() =>
                  setActiveRecipeTypeId(
                    activeRecipeTypeId === recipeType.id ? null : recipeType.id,
                  )
                }
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeRecipeTypeId === recipeType.id
                    ? "bg-[#0097A7] text-white"
                    : "border border-[#DDE9EA] bg-white text-[#66777C] hover:border-[#0097A7]"
                }`}
              >
                {recipeType.name}
              </button>
            ))}
          </div>
        )}

        {recipesLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] w-full" />
            ))}
          </div>
        )}

        {recipesError && <ErrorState onRetry={() => void refetchRecipes()} />}

        {!recipesLoading && !recipesError && recipes.length === 0 && (
          <EmptyState
            icon={<ChefHat size={40} aria-hidden="true" />}
            title="No Paluto recipes yet."
            description="This market doesn't have cook-at-stall recipes available right now."
          />
        )}

        {!recipesLoading && !recipesError && recipes.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                />
              ))}
            </div>

            {hasNextPage && (
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                Load more
              </Button>
            )}
          </>
        )}
      </div>

      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      <RecipeDetailDrawer
        recipeId={selectedRecipeId}
        marketId={selectedMarket.id}
        onClose={() => setSelectedRecipeId(null)}
      />
    </div>
  );
}
