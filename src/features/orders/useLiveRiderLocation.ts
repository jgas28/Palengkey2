import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { firebaseDatabase } from "@/utils/firebaseDatabase";

export interface LiveRiderLocation {
  lat: number;
  lng: number;
  heading: number | null;
  /** Epoch ms of the GPS fix (or of the write when the fix has no time). */
  updatedAt: number | null;
}

/**
 * Live rider position for one order, straight from Firebase Realtime Database
 * (`orders/{orderId}/driver_location`, written by the rider app every few
 * seconds). Null until a fix arrives, when disabled, or when Firebase isn't
 * configured — callers fall back to the API's last known location.
 */
export function useLiveRiderLocation(
  orderId: number | null,
  enabled: boolean,
): LiveRiderLocation | null {
  const [location, setLocation] = useState<LiveRiderLocation | null>(null);

  useEffect(() => {
    setLocation(null);
    if (!enabled || !orderId) return;

    const db = firebaseDatabase();
    if (!db) return;

    const unsubscribe = onValue(
      ref(db, `orders/${orderId}/driver_location`),
      (snapshot) => {
        const value = snapshot.val() as Record<string, unknown> | null;
        const lat = Number(value?.lat);
        const lng = Number(value?.lng);
        if (!value || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

        setLocation({
          lat,
          lng,
          heading: Number.isFinite(Number(value.heading)) ? Number(value.heading) : null,
          updatedAt: Number(value.gps_timestamp ?? value.updated_at) || null,
        });
      },
      // Rules may block reads (e.g. not signed in) — just fall back to the API.
      () => setLocation(null),
    );

    return unsubscribe;
  }, [orderId, enabled]);

  return location;
}
