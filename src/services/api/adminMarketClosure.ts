import { adminApiClient } from "@/services/api/adminClient";

export interface MarketClosureState {
  market_id: number;
  market_name: string;
  min_reopen_date: string;
  max_reopen_date: string;
  is_closed: boolean;
  /** ISO time it reopens by itself; null while open. */
  closed_until: string | null;
  reopens_on: string | null;
  closed_reason: string | null;
}

type WithMessage = MarketClosureState & { message: string };

export const marketClosureQueryKey = (marketId?: number) => [
  "adminMarketClosure",
  marketId,
];

/** marketId is required for super admins; market admins always get their own market. */
export async function getMarketClosure(marketId?: number): Promise<MarketClosureState> {
  const { data } = await adminApiClient.get<MarketClosureState>("/admin/market-closure", {
    params: { market_id: marketId },
  });
  return data;
}

export async function closeMarket(payload: {
  market_id?: number;
  reopen_date: string;
  closed_reason?: string;
}): Promise<WithMessage> {
  const { data } = await adminApiClient.post<WithMessage>(
    "/admin/market-closure/close",
    payload,
  );
  return data;
}

export async function reopenMarket(marketId?: number): Promise<WithMessage> {
  const { data } = await adminApiClient.post<WithMessage>(
    "/admin/market-closure/reopen",
    {
      market_id: marketId,
    },
  );
  return data;
}
