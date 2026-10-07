import { adminApiClient } from "@/services/api/adminClient";
import type { AdminPalutoDish, AdminPalutoStallMenu } from "@/types/adminPalutoDish";
import type { RecipeIngredientKind, RecipePricingUnit } from "@/types/adminRecipe";

export async function listAdminPalutoDishes(
  stallId: number,
): Promise<AdminPalutoStallMenu> {
  const { data } = await adminApiClient.get<AdminPalutoStallMenu>(
    `/admin/paluto-stalls/${stallId}/dishes`,
  );
  return data;
}

export async function getAdminPalutoDish(dishId: number): Promise<AdminPalutoDish> {
  const { data } = await adminApiClient.get<AdminPalutoDish>(
    `/admin/paluto-dishes/${dishId}`,
  );
  return data;
}

export interface PalutoDishFormPayload {
  name: string;
  description?: string;
  recipe_type_id?: number;
  pricing_unit: RecipePricingUnit;
  base_quantity: number;
  rate: number;
  minimum_fee?: number | null;
  status?: boolean;
  image?: File;
  /** Create only — reuses the recipe's cover image when no photo is uploaded. */
  from_recipe_id?: number;
  /** Create only — the items to buy, saved together with the dish. */
  ingredients?: PalutoDishIngredientInput[];
}

function toDishFormData(payload: Partial<PalutoDishFormPayload>): FormData {
  const form = new FormData();
  if (payload.name !== undefined) form.append("name", payload.name);
  if (payload.description) form.append("description", payload.description);
  if (payload.recipe_type_id !== undefined) {
    form.append("recipe_type_id", String(payload.recipe_type_id));
  }
  if (payload.pricing_unit !== undefined)
    form.append("pricing_unit", payload.pricing_unit);
  if (payload.base_quantity !== undefined) {
    form.append("base_quantity", String(payload.base_quantity));
  }
  if (payload.rate !== undefined) form.append("rate", String(payload.rate));
  // Always sent when present in the payload so clearing the field actually clears it.
  if (payload.minimum_fee !== undefined) {
    form.append(
      "minimum_fee",
      payload.minimum_fee === null ? "" : String(payload.minimum_fee),
    );
  }
  if (payload.status !== undefined) form.append("status", payload.status ? "1" : "0");
  if (payload.from_recipe_id !== undefined) {
    form.append("from_recipe_id", String(payload.from_recipe_id));
  }
  if (payload.image) form.append("image", payload.image);
  payload.ingredients?.forEach((ingredient, index) => {
    const prefix = `ingredients[${index}]`;
    form.append(`${prefix}[item_id]`, String(ingredient.item_id));
    form.append(`${prefix}[kind]`, ingredient.kind);
    form.append(`${prefix}[quantity]`, String(ingredient.quantity));
    form.append(`${prefix}[is_optional]`, ingredient.is_optional ? "1" : "0");
    form.append(`${prefix}[is_provided]`, ingredient.is_provided ? "1" : "0");
    if (ingredient.note) form.append(`${prefix}[note]`, ingredient.note);
    form.append(`${prefix}[sort_order]`, String(ingredient.sort_order));
  });
  return form;
}

export async function createAdminPalutoDish(
  stallId: number,
  payload: PalutoDishFormPayload,
): Promise<AdminPalutoDish> {
  const { data } = await adminApiClient.post<AdminPalutoDish>(
    `/admin/paluto-stalls/${stallId}/dishes`,
    toDishFormData(payload),
  );
  return data;
}

export async function updateAdminPalutoDish(
  dishId: number,
  payload: Partial<PalutoDishFormPayload>,
): Promise<AdminPalutoDish> {
  const { data } = await adminApiClient.post<AdminPalutoDish>(
    `/admin/paluto-dishes/${dishId}`,
    toDishFormData(payload),
  );
  return data;
}

export interface PalutoDishIngredientInput {
  item_id: number;
  kind: RecipeIngredientKind;
  quantity: number;
  is_optional: boolean;
  is_provided: boolean;
  note?: string;
  sort_order: number;
}

export async function updateAdminPalutoDishIngredients(
  dishId: number,
  ingredients: PalutoDishIngredientInput[],
): Promise<AdminPalutoDish> {
  const { data } = await adminApiClient.put<AdminPalutoDish>(
    `/admin/paluto-dishes/${dishId}/ingredients`,
    { ingredients },
  );
  return data;
}

export async function deactivateAdminPalutoDish(
  dishId: number,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.delete<{ message: string }>(
    `/admin/paluto-dishes/${dishId}`,
  );
  return data;
}

export async function restoreAdminPalutoDish(
  dishId: number,
): Promise<{ message: string }> {
  const { data } = await adminApiClient.post<{ message: string }>(
    `/admin/paluto-dishes/${dishId}/restore`,
  );
  return data;
}

export interface StallMarketPrice {
  item_id: number;
  in_market: boolean;
  /** Base price before markup; null when the market has no current price. */
  market_price: string | null;
}

export async function getAdminStallMarketPrices(
  stallId: number,
  itemIds: number[],
): Promise<StallMarketPrice[]> {
  const { data } = await adminApiClient.get<StallMarketPrice[]>(
    `/admin/paluto-stalls/${stallId}/market-prices`,
    { params: { item_ids: itemIds } },
  );
  return data;
}
