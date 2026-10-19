import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { photos } from "@/components/pk/photos";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { listPalutoStalls } from "@/services/api/paluto";
import { useMarketStore } from "@/stores/marketStore";

/** The design's Paluto page — hero, then the cooking stalls at the selected market. */
export default function Paluto() {
  const navigate = useNavigate();
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    data: stalls = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["palutoStalls", selectedMarket?.id],
    queryFn: () => listPalutoStalls(selectedMarket!.id),
    enabled: selectedMarket !== null,
  });

  return (
    <main className="inner-page">
      <section className="page-hero paluto-hero">
        <div className="shell page-hero-grid">
          <div>
            <p className="kicker">Cook for me</p>
            <h1>Paluto, made simple.</h1>
            <p>
              Pick a trusted stall and choose your dish. Our staff buys the freshest
              ingredients from the market, then the stall cooks it just the way you like.
            </p>
            <a href="#stalls" className="page-cta">
              Choose a stall <Icon name="arrow" />
            </a>
          </div>
          <div className="page-hero-image">
            <img src={photos.cook} alt="Filipino cook preparing food at a local stall" />
            <span>
              Fresh ingredients
              <br />
              bought per order
            </span>
          </div>
        </div>
      </section>

      <section className="section shell" id="stalls">
        <div className="section-heading">
          <div>
            <p className="kicker">{selectedMarket?.name ?? "Your market"}</p>
            <h2>Choose your cooking stall</h2>
          </div>
          <button
            type="button"
            className="btn outline"
            onClick={() => setPickerOpen(true)}
          >
            {selectedMarket ? "Change market" : "Choose market"}
          </button>
        </div>

        {!selectedMarket ? (
          <div className="empty">
            <Icon name="bag" size={34} />
            <h3>Choose a market to see Paluto stalls</h3>
            <p>Pick your market and we’ll show the stalls that can cook for you there.</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => setPickerOpen(true)}
            >
              Choose market
            </button>
          </div>
        ) : isLoading ? (
          <div className="empty">
            <Icon name="sparkle" size={34} />
            <h3>Finding stalls…</h3>
          </div>
        ) : isError ? (
          <div className="empty">
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : stalls.length === 0 ? (
          <div className="empty">
            <Icon name="sparkle" size={34} />
            <h3>No Paluto stalls here yet</h3>
            <p>
              This market doesn’t have stalls cooking orders right now. You can still cook
              it yourself.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/recipes")}
            >
              Browse recipes
            </button>
          </div>
        ) : (
          <div className="stall-grid">
            {stalls.map((stall) => (
              <article className="stall-card" key={stall.id}>
                <div className="stall-image">
                  <img src={stall.image ?? photos.palengke} alt={stall.name} />
                  <span>
                    <Icon name="sparkle" size={14} /> {stall.dishes_count}{" "}
                    {stall.dishes_count === 1 ? "dish" : "dishes"}
                  </span>
                </div>
                <div>
                  <p className="eyebrow">
                    {stall.is_accepting_orders
                      ? stall.prep_time_minutes
                        ? `~${stall.prep_time_minutes} min prep`
                        : "Cooking today"
                      : "Not taking orders now"}
                  </p>
                  <h3>{stall.name}</h3>
                  <p>{stall.description ?? selectedMarket.name}</p>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => navigate(`/paluto/stalls/${stall.id}`)}
                  >
                    View menu <Icon name="arrow" size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </main>
  );
}
