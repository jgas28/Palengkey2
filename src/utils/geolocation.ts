import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Longest we wait overall. Geolocation's own `timeout` only starts once permission
 * is granted, so an unanswered browser prompt would otherwise block market loading
 * forever — after this we carry on without coordinates.
 */
const OVERALL_TIMEOUT_MS = 6000;

/** Returns null (rather than throwing) if permission is denied, unanswered, or location is unavailable. */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  return Promise.race([
    readCoordinates(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), OVERALL_TIMEOUT_MS)),
  ]);
}

async function readCoordinates(): Promise<Coordinates | null> {
  try {
    // The web implementation's requestPermissions() always throws ("Not
    // implemented on web.") — on web, only calling getCurrentPosition itself
    // triggers the browser's native permission prompt, so the explicit
    // check/request dance is native-only (Android/iOS).
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== "granted") {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== "granted") return null;
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
    });

    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
