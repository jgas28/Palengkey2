import { useQuery } from "@tanstack/react-query";
import InfoPageHeader from "@/components/layout/InfoPageHeader";
import Footer from "@/components/layout/Footer";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Spinner } from "@/components/common/LoadingState";
import { getDeliveryAreas } from "@/services/api/content";

const pinIcon = (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function DeliveryAreas() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["deliveryAreas"],
    queryFn: getDeliveryAreas,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <InfoPageHeader
        icon={pinIcon}
        title="Delivery Areas"
        description="We currently serve selected cities and municipalities near partner markets."
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.available.length === 0 && data.coming_soon.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🗺️</span>}
          title="No delivery areas yet."
          description="Check back soon — we're expanding to new areas."
        />
      )}

      {data && (data.available.length > 0 || data.coming_soon.length > 0) && (
        <div className="flex flex-col gap-6">
          {data.available.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Available Now
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.available.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-soft"
                  >
                    <span className="truncate text-sm font-medium text-text">{area}</span>
                    <span className="flex items-center gap-1.5 rounded-pill bg-status-delivered/10 px-2.5 py-1 text-xs font-semibold text-status-delivered">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-status-delivered"
                        aria-hidden="true"
                      />
                      Available
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.coming_soon.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Coming Soon
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.coming_soon.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-soft opacity-90"
                  >
                    <span className="truncate text-sm font-medium text-text">{area}</span>
                    <span className="flex items-center gap-1.5 rounded-pill bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-700">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-accent-500"
                        aria-hidden="true"
                      />
                      Coming Soon
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="flex items-start gap-2 rounded-card border border-accent-200 bg-accent-50 p-4 text-sm text-accent-700">
            <span aria-hidden="true">ℹ️</span>
            Coverage may change based on market availability and rider capacity.
          </p>
        </div>
      )}

      <Footer />
    </div>
  );
}
