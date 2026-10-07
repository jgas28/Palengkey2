import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import PkProductModal from "@/features/home/PkProductModal";
import { useMarketStore } from "@/stores/marketStore";

/**
 * Deep link to one product (/product/:id). The design shows products as a quick
 * view over the shop, so this opens the same modal on the shop backdrop and
 * returns to the shop when closed.
 */
export default function ProductDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [pickerOpen, setPickerOpen] = useState(false);
  const id = Number(itemId);

  return (
    <main className="inner-page shop-page account-bg">
      {!selectedMarket ? (
        <div className="shell page-title">
          <p className="kicker">One more step</p>
          <h1>Choose a market first</h1>
          <p>Pick a market to see this product&apos;s price and availability.</p>
          <button type="button" className="btn primary" style={{ marginTop: 20 }} onClick={() => setPickerOpen(true)}>
            <Icon name="bag" size={17} /> Choose market
          </button>
          <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
        </div>
      ) : (
        Number.isFinite(id) && (
          <PkProductModal itemId={id} marketId={selectedMarket.id} onClose={() => navigate("/shop")} />
        )
      )}
    </main>
  );
}
