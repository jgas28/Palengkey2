import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Returns null (rather than throwing) if permission is denied or location is unavailable. */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
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
