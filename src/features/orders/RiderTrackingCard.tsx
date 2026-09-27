import { useQuery } from "@tanstack/react-query";
import { getRiderLocation } from "@/services/api/riderTracking";
import { calculateDistanceKm } from "@/utils/distance";
import { normalizeOrderStatus } from "@/features/orders/orderStatus";
import type { Order } from "@/types/order";

function minutesAgo(isoDate: string | null): string {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes === 0) return "just now";
  return `${minutes} min ago`;
}

export default function RiderTrackingCard({ order }: { order: Order }) {
  const isOutForDelivery = normalizeOrderStatus(order.status) === "out_for_delivery";

  const { data: location } = useQuery({
    queryKey: ["riderLocation", order.id],
    queryFn: () => getRiderLocation(order.id),
    refetchInterval: 8000,
    enabled: isOutForDelivery,
  });

  if (!isOutForDelivery || !order.rider) return null;

  const distanceKm = location
    ? calculateDistanceKm(
        location.latitude,
        location.longitude,
        order.latitude,
        order.longitude,
      )
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-primary-100 bg-primary-50 p-4 shadow-soft">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text">
        <span aria-hidden="true">🛵</span> Your rider is on the way
      </h2>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
            {order.rider.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-text">{order.rider.name}</p>
            {distanceKm !== null && (
              <p className="text-xs text-text-muted">
                About {distanceKm.toFixed(1)} km away
                {location && ` · updated ${minutesAgo(location.updated_at)}`}
              </p>
            )}
          </div>
        </div>
        <a
          href={`tel:${order.rider.phone}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow-soft transition-transform active:scale-95"
          aria-label="Call rider"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
