import { useMemo, type ReactNode } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Spinner } from "@/components/common/LoadingState";
import type { AdminRiderTrackingEntry } from "@/types/adminRider";
import type { AdminMarket } from "@/types/adminMarket";

export interface AdminTrackingMapProps {
  riders: AdminRiderTrackingEntry[];
  markets: AdminMarket[];
  selectedRiderId: number | null;
  onSelectRider?: (riderId: number) => void;
  /** Floating content laid over the map (e.g. the selected rider card). */
  children?: ReactNode;
}

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "420px" };

const RIDER_COLORS = {
  selected: "#f9a825",
  available: "#0097A7",
  delivering: "#0097A7",
  offline: "#94a3b8",
};

export default function AdminTrackingMap({
  riders,
  markets,
  selectedRiderId,
  onSelectRider,
  children,
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

  const frame =
    "relative overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf4f2]";

  if (loadError) {
    return (
      <div className={`${frame} flex h-[420px] items-center justify-center`}>
        <p className="text-sm text-slate-500">Couldn't load the map.</p>
        {children}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${frame} flex h-[420px] items-center justify-center`}>
        <Spinner />
      </div>
    );
  }

  // Markets: small white-ringed teal dot. Riders: larger coloured pin with initial.
  const marketIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 6,
    fillColor: "#00737E",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
  const riderIcon = (color: string, selected: boolean): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: selected ? 15 : 12,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
  });

  return (
    <div className={frame}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={selectedRiderId ? 15 : 12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
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
        {locatedRiders.map((rider) => {
          const selected = rider.id === selectedRiderId;
          const color = selected
            ? RIDER_COLORS.selected
            : RIDER_COLORS[rider.status ?? "available"];
          return (
            <MarkerF
              key={`rider-${rider.id}`}
              position={{ lat: rider.latitude, lng: rider.longitude }}
              title={rider.name}
              icon={riderIcon(color, selected)}
              zIndex={selected ? 10 : 1}
              onClick={() => onSelectRider?.(rider.id)}
              label={{
                text: rider.name.charAt(0).toUpperCase(),
                color: "white",
                fontSize: "11px",
                fontWeight: "700",
              }}
            />
          );
        })}
      </GoogleMap>
      {children}
    </div>
  );
}
