import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { photos } from "@/components/pk/photos";
import PalutoDishDrawer from "@/features/paluto/PalutoDishDrawer";
import {
  computeCookingFee,
  estimateIngredientsCost,
  hasUnavailableIngredient,
} from "@/features/paluto/palutoPricing";
import { formatBatch } from "@/features/recipes/ingredientFormat";
import { getPalutoStall } from "@/services/api/paluto";
import { formatPeso } from "@/utils/currency";

/** One stall's menu — the design's selected-stall view (stall summary, dish cards, how-it-works note). */
export default function PalutoStallMenu() {
  const { stallId } = useParams<{ stallId: string }>();
  const navigate = useNavigate();
  const id = Number(stallId);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);

  const { data: stall, isLoading, isError, refetch } = useQuery({
    queryKey: ["palutoStall", id],
    queryFn: () => getPalutoStall(id),
    enabled: Number.isFinite(id),
  });

  const selectedDish = stall?.dishes.find((dish) => dish.id === selectedDishId) ?? null;

  return (
    <main className="inner-page">
      <section className="section shell" style={{ paddingTop: 56 }}>
        <div className="section-heading">
          <div>
            <p className="kicker">Paluto · Cooked to order</p>
            <h2>{stall?.name ?? "Stall menu"}</h2>
          </div>
          <button type="button" className="btn outline" onClick={() => navigate("/paluto")}>
            All stalls
          </button>
        </div>

        {isLoading && (
          <div className="empty">
            <Icon name="sparkle" size={34} />
            <h3>Loading the menu…</h3>
          </div>
        )}
        {isError && (
          <div className="empty">
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        )}

        {stall && (
          <>
            <div className="stall-summary">
              <img src={stall.image ?? photos.palengke} alt="" />
              <div>
                <strong>{stall.description ?? stall.name}</strong>
                <p>
                  {stall.is_accepting_orders
                    ? `${stall.prep_time_minutes ? `~${stall.prep_time_minutes} min prep · ` : ""}Ingredients bought fresh after you order`
                    : "Not taking orders right now — check back later"}
                </p>
              </div>
            </div>

            {stall.dishes.length === 0 ? (
              <div className="empty">
                <Icon name="sparkle" size={34} />
                <h3>No dishes on the menu yet</h3>
                <p>Check back later or pick another stall.</p>
              </div>
            ) : (
              <div className="dish-grid">
                {stall.dishes.map((dish) => {
                  const base = Number(dish.base_quantity);
                  const unavailable = hasUnavailableIngredient(dish);
                  const estimate = estimateIngredientsCost(dish, base) + computeCookingFee(dish, base);
                  return (
                    <article className="dish-card" key={dish.id}>
                      <div className="dish-icon">
                        <Icon name="sparkle" />
                      </div>
                      <p className="eyebrow">
                        {dish.recipe_type ?? "Cooked to order"} · {formatBatch(dish.pricing_unit, dish.base_quantity)}
                      </p>
                      <h3>{dish.name}</h3>
                      <p>{dish.description ?? "Cooked fresh by the stall from ingredients we buy for you."}</p>
                      <div>
                        <strong>{unavailable ? "—" : `~${formatPeso(estimate)}`}</strong>
                        <button
                          type="button"
                          className="btn add-dish"
                          disabled={unavailable || !stall.is_accepting_orders}
                          onClick={() => setSelectedDishId(dish.id)}
                        >
                          {unavailable ? (
                            "Unavailable today"
                          ) : (
                            <>
                              <Icon name="plus" size={17} /> Add order
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="paluto-note">
              <Icon name="bag" />
              <div>
                <strong>How your Paluto order works</strong>
                <p>
                  The price is the stall&apos;s ingredients at today&apos;s market prices plus its
                  cooking fee. We buy only what the stall needs, hand it over, and they cook it fresh
                  for you. Final ingredient prices are confirmed at checkout.
                </p>
              </div>
            </div>

            <PalutoDishDrawer stall={stall} dish={selectedDish} onClose={() => setSelectedDishId(null)} />
          </>
        )}
      </section>
    </main>
  );
}
