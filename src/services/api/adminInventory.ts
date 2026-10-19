import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminInventoryBoard,
  AdminInventoryUpdateResult,
} from "@/types/adminInventory";

export async function getAdminInventoryBoard(
  marketId?: number,
): Promise<AdminInventoryBoard> {
  const { data } = await adminApiClient.get<AdminInventoryBoard>("/admin/inventory", {
    params: { market_id: marketId },
  });
  return data;
}

export interface InventoryRowUpdate {
  item_id: number;
  price: number | null;
  is_available: boolean;
  cutoff_time: string | null;
}

export async function updateAdminInventoryBoard(
  rows: InventoryRowUpdate[],
  marketId?: number,
): Promise<AdminInventoryUpdateResult> {
  const { data } = await adminApiClient.post<AdminInventoryUpdateResult>(
    "/admin/inventory/update-board",
    { rows },
    { params: { market_id: marketId } },
  );
  return data;
}

export async function importAdminInventoryCsv(
  file: File,
  marketId?: number,
): Promise<AdminInventoryUpdateResult> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await adminApiClient.post<AdminInventoryUpdateResult>(
    "/admin/inventory/import",
    form,
    { params: { market_id: marketId } },
  );
  return data;
}

export async function downloadAdminInventoryTemplate(marketId?: number): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>("/admin/inventory/template", {
    params: { market_id: marketId },
    responseType: "blob",
  });
  return data;
}
