import { useCallback, useEffect, useState } from "react";
import {
  DirectionsRenderer,
  GoogleMap,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";
import { Store, MapPin } from "lucide-react";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Spinner } from "@/components/common/LoadingState";

interface LatLng {
  lat: number;
  lng: number;
}

export interface CheckoutRouteMapProps {
  market: LatLng & { name: string };
  destination: LatLng & { label: string };
  /** Straight-line estimate from the delivery-fee API — shown only if no road route is found. */
  distanceKm?: number;
  etaMin?: number;
  etaMax?: number;
  /** Live rider position while out for delivery. */
  rider?: LatLng | null;
  height?: number;
}

const DEFAULT_HEIGHT = 200;
const BRAND = "#0097A7";
const ALTERNATE = "#7C8B90";

interface RouteOption {
  index: number;
  distanceText: string;
  durationText: string;
}

type RouteState =
  | { status: "loading" }
  | {
      status: "found";
      result: google.maps.DirectionsResult;
      fastest: RouteOption;
      /** Same as `fastest` when the quickest route is also the shortest. */
      shortest: RouteOption;
    }
  | { status: "unavailable" };

/** Picks the quickest and the shortest of Google's alternative routes. */
function pickRoutes(
  result: google.maps.DirectionsResult,
): { fastest: RouteOption; shortest: RouteOption } | null {
  const options = result.routes
    .map((route, index) => {
      const leg = route.legs[0];
      return leg
        ? {
            index,
            seconds: leg.duration?.value ?? Infinity,
            meters: leg.distance?.value ?? Infinity,
            distanceText: leg.distance?.text ?? "",
            durationText: leg.duration?.text ?? "",
          }
        : null;
    })
    .filter((option): option is NonNullable<typeof option> => option !== null);

  if (options.length === 0) return null;

  const fastest = options.reduce((best, o) => (o.seconds < best.seconds ? o : best));
  const shortest = options.reduce((best, o) => (o.meters < best.meters ? o : best));
  return { fastest, shortest };
}

/**
 * Market and delivery address on one map with the motorcycle-friendly routes
 * between them (Google Directions, avoiding tolls and highways): the fastest in
 * brand colour and, when different, the shortest in grey. Falls back to a dashed
 * straight line when no route is available, e.g. the Directions API isn't
 * enabled for the key.
 */
export default function CheckoutRouteMap({
  market,
  destination,
  distanceKm,
  etaMin,
  etaMax,
  rider,
  height = DEFAULT_HEIGHT,
}: CheckoutRouteMapProps) {
  const MAP_HEIGHT = height;
  const MAP_CONTAINER_STYLE = { width: "100%", height: `${height}px` };
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [route, setRoute] = useState<RouteState>({ status: "loading" });

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    setRoute({ status: "loading" });

    new google.maps.DirectionsService()
      .route({
        origin: { lat: market.lat, lng: market.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        // Riders are on motorcycles — they can't use expressways/tollways.
        avoidTolls: true,
        avoidHighways: true,
        provideRouteAlternatives: true,
      })
      .then((result) => {
        if (cancelled) return;
        const picked = pickRoutes(result);
        setRoute(
          picked ? { status: "found", result, ...picked } : { status: "unavailable" },
        );
      })
      .catch(() => {
        if (!cancelled) setRoute({ status: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, market.lat, market.lng, destination.lat, destination.lng]);

  const fitBoth = useCallback(
    (map: google.maps.Map) => {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(market);
      bounds.extend(destination);
      map.fitBounds(bounds, 48);
    },
    // Re-frame only when either point actually moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [market.lat, market.lng, destination.lat, destination.lng],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE9EA]">
      {loadError ? null : !isLoaded ? (
        <div
          className="flex items-center justify-center bg-[#F7FAFA]"
          style={{ height: MAP_HEIGHT }}
        >
          <Spinner />
        </div>
      ) : (
        <GoogleMap
          key={`${market.lat},${market.lng}-${destination.lat},${destination.lng}`}
          mapContainerStyle={MAP_CONTAINER_STYLE}
          onLoad={fitBoth}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: "cooperative",
          }}
        >
          <MarkerF
            position={market}
            title={market.name}
            label={{ text: "M", color: "#ffffff", fontWeight: "700" }}
          />
          <MarkerF position={destination} title={destination.label} />
          {rider && (
            <MarkerF
              position={rider}
              title="Your rider"
              label={{ text: "R", color: "#ffffff", fontWeight: "700" }}
              zIndex={3}
            />
          )}

          {route.status === "found" && route.shortest.index !== route.fastest.index && (
            <DirectionsRenderer
              directions={route.result}
              routeIndex={route.shortest.index}
              options={{
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                  strokeColor: ALTERNATE,
                  strokeWeight: 4,
                  strokeOpacity: 0.7,
                },
              }}
            />
          )}

          {route.status === "found" && (
            <DirectionsRenderer
              directions={route.result}
              routeIndex={route.fastest.index}
              options={{
                suppressMarkers: true,
                preserveViewport: false,
                polylineOptions: {
                  strokeColor: BRAND,
                  strokeWeight: 5,
                  strokeOpacity: 0.9,
                  zIndex: 2,
                },
              }}
            />
          )}

          {route.status === "unavailable" && (
            <PolylineF
              path={[market, destination]}
              options={{
                strokeOpacity: 0,
                icons: [
                  {
                    icon: {
                      path: "M 0,-1 0,1",
                      strokeOpacity: 1,
                      strokeColor: BRAND,
                      scale: 3,
                    },
                    offset: "0",
                    repeat: "12px",
                  },
                ],
              }}
            />
          )}
        </GoogleMap>
      )}

      <div className="flex flex-col gap-1.5 bg-white p-3 text-xs text-[#66777C]">
        <p className="flex items-center gap-1.5">
          <Store size={14} className="shrink-0 text-[#0097A7]" aria-hidden="true" />
          <span>
            From <strong className="text-[#203238]">{market.name}</strong>
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-[#E53935]" aria-hidden="true" />
          <span>
            To <strong className="text-[#203238]">{destination.label}</strong>
          </span>
        </p>
        {route.status === "found" ? (
          route.shortest.index === route.fastest.index ? (
            <p>
              Fastest and shortest route:{" "}
              <strong className="text-[#203238]">{route.fastest.durationText}</strong> ·{" "}
              {route.fastest.distanceText} · no tolls or highways
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1 w-4 rounded-full bg-[#0097A7]" />
                Fastest:{" "}
                <strong className="text-[#203238]">
                  {route.fastest.durationText}
                </strong> · {route.fastest.distanceText}
              </p>
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1 w-4 rounded-full bg-[#7C8B90]" />
                Shortest:{" "}
                <strong className="text-[#203238]">
                  {route.shortest.distanceText}
                </strong>{" "}
                · {route.shortest.durationText}
              </p>
              <p>Motorcycle-friendly — no tolls or highways</p>
            </div>
          )
        ) : (
          route.status === "unavailable" &&
          distanceKm !== undefined &&
          distanceKm > 0 && (
            <p>
              ~{distanceKm.toFixed(1)} km away
              {etaMin !== undefined && etaMax !== undefined && etaMax > 0
                ? ` · about ${etaMin}–${etaMax} min delivery`
                : ""}
            </p>
          )
        )}
      </div>
    </div>
  );
}
