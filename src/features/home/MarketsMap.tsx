import { useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Spinner } from "@/components/common/LoadingState";
import type { Market } from "@/types/market";

export interface MarketsMapProps {
  markets: Market[];
  selectedMarketId?: number;
  onSelect?: (market: Market) => void;
}

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "180px", borderRadius: "16px" };

export default function MarketsMap({ markets, selectedMarketId, onSelect }: MarketsMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();

  const center = useMemo(() => {
    const selected = markets.find((m) => m.id === selectedMarketId);
    if (selected) return { lat: selected.latitude, lng: selected.longitude };
    if (markets.length > 0) return { lat: markets[0].latitude, lng: markets[0].longitude };
    return DEFAULT_CENTER;
  }, [markets, selectedMarketId]);

  if (loadError || markets.length === 0) return null;

  if (!isLoaded) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-2xl border border-[#DDE9EA] bg-[#F7FAFA]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DDE9EA]">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={12}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {markets.map((market) => (
          <MarkerF
            key={market.id}
            position={{ lat: market.latitude, lng: market.longitude }}
            title={market.name}
            opacity={market.id === selectedMarketId ? 1 : 0.6}
            onClick={() => onSelect?.(market)}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
