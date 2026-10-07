import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { photos } from "@/components/pk/photos";
import RecipeDetailDrawer from "@/features/recipes/RecipeDetailDrawer";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { formatBatch } from "@/features/recipes/ingredientFormat";
import { listRecipes, listRecipeTypes } from "@/services/api/recipes";
import { useMarketStore } from "@/stores/marketStore";

/** The design's Recipes page — global catalog; ingredients priced at the selected market in the drawer. */
export default function Recipes() {
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

  const { data: recipeTypes = [] } = useQuery({ queryKey: ["recipeTypes"], queryFn: listRecipeTypes });

  const { data: recipePages, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["recipes", activeRecipeTypeId, debouncedSearch],
      queryFn: ({ pageParam }) =>
        listRecipes({
          recipeTypeId: activeRecipeTypeId ?? undefined,
          search: debouncedSearch,
          page: pageParam,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    });

  const recipes = useMemo(() => recipePages?.pages.flatMap((page) => page.data) ?? [], [recipePages]);

  return (
    <main className="inner-page">
      <section className="page-hero recipe-hero">
        <div className="shell recipe-intro">
          <p className="kicker">Cook it yourself</p>
          <h1>Recipes for every Filipino table.</h1>
          <p>Step-by-step home cooking, with every fresh ingredient ready to add to your basket.</p>
          <div className="recipe-search">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sinigang, adobo, gulay..."
              aria-label="Search recipes"
            />
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading products-heading">
          <div>
            <p className="kicker">Market-to-kitchen guides</p>
            <h2>What are we cooking?</h2>
          </div>
          {recipeTypes.length > 0 && (
            <div className="filter-pills" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={activeRecipeTypeId === null ? "active" : ""}
                onClick={() => setActiveRecipeTypeId(null)}
              >
                All
              </button>
              {recipeTypes.map((type) => (
                <button
                  type="button"
                  key={type.id}
                  className={activeRecipeTypeId === type.id ? "active" : ""}
                  onClick={() => setActiveRecipeTypeId(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="empty">
            <Icon name="leaf" size={34} />
            <h3>Loading recipes…</h3>
          </div>
        ) : isError ? (
          <div className="empty">
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty">
            <Icon name="leaf" size={34} />
            <h3>No recipes found</h3>
            <p>Try a different search or recipe type.</p>
          </div>
        ) : (
          <>
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <article className="full-recipe-card" key={recipe.id} onClick={() => setSelectedRecipeId(recipe.id)}>
                  <div>
                    <img src={recipe.image ?? photos.vendor} alt={recipe.name} />
                    <span>
                      {formatBatch(recipe.pricing_unit, recipe.base_quantity)}
                      {recipe.recipe_type ? ` · ${recipe.recipe_type}` : ""}
                    </span>
                  </div>
                  <section>
                    <h3>{recipe.name}</h3>
                    <p>{recipe.description ?? "A Filipino favorite, with every ingredient ready to add to your basket."}</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedRecipeId(recipe.id);
                      }}
                    >
                      View recipe <Icon name="arrow" size={17} />
                    </button>
                  </section>
                </article>
              ))}
            </div>
            {hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <button type="button" className="btn outline" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                  {isFetchingNextPage ? "Loading…" : "Load more recipes"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <RecipeDetailDrawer
        recipeId={selectedRecipeId}
        marketId={selectedMarket?.id ?? null}
        marketName={selectedMarket?.name ?? null}
        onChooseMarket={() => setPickerOpen(true)}
        onClose={() => setSelectedRecipeId(null)}
      />
      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </main>
  );
}
