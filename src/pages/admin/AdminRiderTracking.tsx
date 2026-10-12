import { useState } from "react";
import { useLiveRiderPositions } from "@/features/admin/useLiveRiderPositions";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import AdminTrackingMap from "@/features/admin/AdminTrackingMap";
import { getAdminRiderTracking } from "@/services/api/adminRiders";
import { listAdminMarketsFull } from "@/services/api/adminMarkets";

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return "No location yet";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes === 0) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  return `Updated ${Math.round(minutes / 60)} h ago`;
}

export default function AdminRiderTracking() {
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminRiderTracking"],
    queryFn: getAdminRiderTracking,
    refetchInterval: 10000,
  });

  // Firebase gives live fixes from the rider app; use whichever is newer than the API's last saved one.
  const live = useLiveRiderPositions((data ?? []).map((rider) => rider.id));
  const riders = (data ?? []).map((rider) => {
    const fix = live[rider.id];
    const apiTime = rider.last_location_update
      ? new Date(rider.last_location_update).getTime()
      : 0;
    return fix && (fix.updatedAt ?? 0) >= apiTime
      ? {
          ...rider,
          latitude: fix.lat,
          longitude: fix.lng,
          last_location_update: fix.updatedAt
            ? new Date(fix.updatedAt).toISOString()
            : rider.last_location_update,
        }
      : rider;
  });

  const { data: marketsPage } = useQuery({
    queryKey: ["adminMarketsFull", "active"],
    queryFn: () => listAdminMarketsFull({ status: 1 }),
  });
  const activeMarkets = marketsPage?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rider Tracking</h1>
        <span className="text-xs text-text-muted">Live from the rider app</span>
      </div>

      {data && data.length > 0 && (
        <AdminTrackingMap
          riders={riders}
          markets={activeMarkets}
          selectedRiderId={selectedRiderId}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No active riders."
          description="Activate a rider on the Riders page to see them here."
        />
      )}

      {data && data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {riders.map((rider) => {
            const isLocated = rider.latitude !== null && rider.longitude !== null;
            const isSelected = rider.id === selectedRiderId;
            return (
              <li key={rider.id}>
                <button
                  type="button"
                  disabled={!isLocated}
                  onClick={() => setSelectedRiderId(isSelected ? null : rider.id)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                    isSelected ? "bg-primary-50" : "hover:bg-background"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-text">{rider.name}</span>
                    <span className="text-xs text-text-muted">
                      {rider.phone} · {rider.vehicle_type}
                      {rider.market_name && ` · ${rider.market_name}`}
                    </span>
                    <span
                      className={`text-xs ${
                        isLocated ? "text-status-delivered" : "text-text-muted"
                      }`}
                    >
                      {timeAgo(rider.last_location_update)}
                    </span>
                  </div>
                  {isLocated && (
                    <span
                      className={`whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold ${
                        isSelected
                          ? "bg-primary-500 text-white"
                          : "bg-primary-50 text-primary-700"
                      }`}
                    >
                      {isSelected ? "Showing on map" : "Show on map"}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
