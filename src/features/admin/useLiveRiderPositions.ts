import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { firebaseDatabase } from "@/utils/firebaseDatabase";

export interface LivePosition {
  lat: number;
  lng: number;
  /** Epoch ms of the fix. */
  updatedAt: number | null;
}

/** Live positions from Firebase `riders_location/{riderId}` for the given riders, keyed by rider id. */
export function useLiveRiderPositions(riderIds: number[]): Record<number, LivePosition> {
  const [positions, setPositions] = useState<Record<number, LivePosition>>({});
  const key = [...riderIds].sort((a, b) => a - b).join(",");

  useEffect(() => {
    const db = firebaseDatabase();
    if (!db || !key) return;

    const unsubscribers = key
      .split(",")
      .map(Number)
      .map((riderId) =>
        onValue(
          ref(db, `riders_location/${riderId}`),
          (snapshot) => {
            const value = snapshot.val() as Record<string, unknown> | null;
            const lat = Number(value?.lat);
            const lng = Number(value?.lng);
            if (!value || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
            setPositions((current) => ({
              ...current,
              [riderId]: {
                lat,
                lng,
                updatedAt: Number(value.gps_timestamp ?? value.updated_at) || null,
              },
            }));
          },
          () => undefined, // read blocked by rules — the API positions still show
        ),
      );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [key]);

  return positions;
}
