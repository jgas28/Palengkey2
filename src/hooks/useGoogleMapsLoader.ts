import { useJsApiLoader } from "@react-google-maps/api";
import { env } from "@/config/env";

const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

/** Shared loader — reuse this in every map component so the Google Maps
 * script is only ever requested once, even if multiple maps are on screen. */
export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.googleMapsApiKey ?? "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}
