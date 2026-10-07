import type { PalutoDishIngredientInput } from "@/services/api/adminPalutoDishes";
import type { AdminPalutoDish } from "@/types/adminPalutoDish";
import type { AdminRecipeIngredient, RecipeIngredientKind } from "@/types/adminRecipe";

/** One line of a stall dish's "items to buy" list while it's being edited. */
export interface IngredientRow {
  key: string;
  item_id: number;
  item_name: string;
  kind: RecipeIngredientKind;
  quantity: string;
  unit_name: string | null;
  is_optional: boolean;
  is_provided: boolean;
  note: string;
  /** null until the stall-market lookup has answered for this item. */
  in_market: boolean | null;
  market_price: number | null;
}

let rowKeySeq = 0;
export function nextRowKey(): string {
  rowKeySeq += 1;
  return `ingredient-${rowKeySeq}`;
}

export function rowsFromDish(dish: AdminPalutoDish): IngredientRow[] {
  return dish.ingredients.map((ingredient) => ({
    key: nextRowKey(),
    item_id: ingredient.item_id,
    item_name: ingredient.item_name ?? `Item #${ingredient.item_id}`,
    kind: ingredient.kind,
    quantity: ingredient.quantity,
    unit_name: ingredient.unit_name,
    is_optional: ingredient.is_optional,
    is_provided: ingredient.is_provided,
    note: ingredient.note ?? "",
    in_market: ingredient.in_market,
    market_price:
      ingredient.market_price !== null ? Number(ingredient.market_price) : null,
  }));
}

/** A recipe's list as a starting point — prices are looked up for the stall's market afterwards. */
export function rowsFromRecipe(ingredients: AdminRecipeIngredient[]): IngredientRow[] {
  return ingredients.map((ingredient) => ({
    key: nextRowKey(),
    item_id: ingredient.item_id,
    item_name: ingredient.item_name,
    kind: ingredient.kind,
    quantity: ingredient.quantity,
    unit_name: ingredient.unit_name,
    is_optional: ingredient.is_optional,
    is_provided: false,
    note: ingredient.note ?? "",
    in_market: null,
    market_price: null,
  }));
}

export function toIngredientInputs(rows: IngredientRow[]): PalutoDishIngredientInput[] {
  return rows.map((row, index) => ({
    item_id: row.item_id,
    kind: row.kind,
    quantity: Number(row.quantity),
    is_optional: row.is_optional,
    is_provided: row.is_provided,
    note: row.note || undefined,
    sort_order: index,
  }));
}

/** A line the customer pays for that the stall's market doesn't sell — blocks saving. */
export function isBlockingRow(row: IngredientRow): boolean {
  return !row.is_optional && !row.is_provided && row.in_market === false;
}

export function hasInvalidQuantity(rows: IngredientRow[]): boolean {
  return rows.some((row) => !row.quantity || Number(row.quantity) <= 0);
}
