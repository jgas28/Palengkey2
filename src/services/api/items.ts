import { apiClient } from "@/services/api/client";
import type { ItemDetail, ItemSummary } from "@/types/item";
import type { PaginatedResponse } from "@/types/pagination";

export interface ListItemsParams {
  marketId: number;
  categoryId?: number;
  typeId?: number;
  search?: string;
  sort?: string;
  page?: number;
}

export async function listItems(
  params: ListItemsParams,
): Promise<PaginatedResponse<ItemSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<ItemSummary>>(
    "/customer/items",
    {
      params: {
        market_id: params.marketId,
        category_id: params.categoryId,
        type_id: params.typeId,
        search: params.search || undefined,
        sort: params.sort && params.sort !== "recommended" ? params.sort : undefined,
        page: params.page,
      },
    },
  );
  return data;
}

export async function getItem(itemId: number, marketId: number): Promise<ItemDetail> {
  const { data } = await apiClient.get<ItemDetail>(`/customer/items/${itemId}`, {
    params: { market_id: marketId },
  });
  return data;
}

export interface ListCuratedProductsParams {
  marketId: number;
  section: "highlighted_products" | "best_deals";
}

/** Admin-curated items for a landing-page section, in the order staff configured them. */
export async function listCuratedProducts(
  params: ListCuratedProductsParams,
): Promise<ItemSummary[]> {
  const { data } = await apiClient.get<{ data: ItemSummary[] }>(
    "/customer/curated-products",
    {
      params: { market_id: params.marketId, section: params.section },
    },
  );
  return data.data;
}
