import { useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Spinner } from "@/components/common/LoadingState";
import type { AdminRiderTrackingEntry } from "@/types/adminRider";
import type { AdminMarket } from "@/types/adminMarket";

export interface AdminTrackingMapProps {
  riders: AdminRiderTrackingEntry[];
  markets: AdminMarket[];
  selectedRiderId: number | null;
}

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "360px", borderRadius: "20px" };

export default function AdminTrackingMap({
  riders,
  markets,
  selectedRiderId,
}: AdminTrackingMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();

  const locatedRiders = useMemo(
    () =>
      riders.filter(
        (r): r is AdminRiderTrackingEntry & { latitude: number; longitude: number } =>
          r.latitude !== null && r.longitude !== null,
      ),
    [riders],
  );

  const center = useMemo(() => {
    const selected = locatedRiders.find((r) => r.id === selectedRiderId);
    if (selected) return { lat: selected.latitude, lng: selected.longitude };
    if (locatedRiders.length > 0) {
      return { lat: locatedRiders[0].latitude, lng: locatedRiders[0].longitude };
    }
    if (markets.length > 0) {
      return { lat: Number(markets[0].latitude), lng: Number(markets[0].longitude) };
    }
    return DEFAULT_CENTER;
  }, [locatedRiders, markets, selectedRiderId]);

  if (loadError) {
    return (
      <p className="rounded-card border border-border bg-background p-4 text-sm text-text-muted">
        Couldn't load the map.
      </p>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-card border border-border bg-background">
        <Spinner />
      </div>
    );
  }

  // Markets get a distinct teal circle marker; riders keep Google's default
  // pin (with an initial-letter label) so the two are easy to tell apart.
  const marketIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: "#0097A7",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };

  return (
    <div className="overflow-hidden rounded-card border border-border">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={selectedRiderId ? 15 : 12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {markets.map((market) => (
          <MarkerF
            key={`market-${market.id}`}
            position={{ lat: Number(market.latitude), lng: Number(market.longitude) }}
            title={`${market.name} (market)`}
            icon={marketIcon}
          />
        ))}
        {locatedRiders.map((rider) => (
          <MarkerF
            key={`rider-${rider.id}`}
            position={{ lat: rider.latitude, lng: rider.longitude }}
            title={`${rider.name} (rider)`}
            label={{
              text: rider.name.charAt(0).toUpperCase(),
              color: "white",
              fontSize: "11px",
              fontWeight: "700",
            }}
            opacity={rider.id === selectedRiderId ? 1 : 0.75}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
