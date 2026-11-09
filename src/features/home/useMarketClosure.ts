import { useQuery } from "@tanstack/react-query";
import { listMarkets } from "@/services/api/markets";

/** "Mon, Nov 10" in Manila time. */
export function formatReopenDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * The market when an admin has closed it, else null. Always asks the API: the
 * market saved in the browser can be days old.
 */
export function useMarketClosure(marketId?: number | null) {
  const { data: markets } = useQuery({
    queryKey: ["marketClosures"],
    queryFn: () => listMarkets(),
    enabled: Boolean(marketId),
  });

  const market = markets?.find((m) => m.id === marketId);
  return market?.is_closed && market.closed_until ? market : null;
}
