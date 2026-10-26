import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/common/LoadingState";
import { listAdminItems } from "@/services/api/adminItems";
import { getAdminStallMarketPrices } from "@/services/api/adminPalutoDishes";
import { formatPeso } from "@/utils/currency";
import { kindFromCategory } from "@/features/recipes/ingredientFormat";
import {
  isBlockingRow,
  nextRowKey,
  type IngredientRow,
} from "@/features/admin/paluto/dishIngredientRows";
import type { RecipeIngredientKind } from "@/types/adminRecipe";

const KIND_LABELS: Record<RecipeIngredientKind, string> = {
  meat: "Meat",
  vegetable: "Vegetable",
  condiment: "Condiment",
  spice: "Spice",
};

export interface DishIngredientsEditorProps {
  stallId: number;
  marketId: number;
  marketName: string | null;
  /** e.g. "1 kg" — what the quantities are written for. */
  batchLabel: string;
  rows: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
}

/**
 * The list of items to buy for one stall dish. The picker only searches items sold at
 * the stall's market, and every line shows that market's live price.
 */
export default function DishIngredientsEditor({
  stallId,
  marketId,
  marketName,
  batchLabel,
  rows,
  onChange,
}: DishIngredientsEditorProps) {
  const [itemSearch, setItemSearch] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const marketLabel = marketName ?? "this stall's market";

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedItemSearch(itemSearch.trim()), 300);
    return () => clearTimeout(timeout);
  }, [itemSearch]);

  const { data: itemResults, isFetching: itemsFetching } = useQuery({
    queryKey: ["adminItemSearch", debouncedItemSearch, marketId],
    queryFn: () =>
      listAdminItems({ search: debouncedItemSearch, status: "1", marketId, page: 1 }),
    enabled: debouncedItemSearch.length > 1,
  });

  // Lines copied from a recipe arrive without market info — look it up once.
  const unpricedItemIds = rows
    .filter((row) => row.in_market === null)
    .map((row) => row.item_id);
  const { data: lookedUpPrices } = useQuery({
    queryKey: ["adminStallMarketPrices", stallId, unpricedItemIds],
    queryFn: () => getAdminStallMarketPrices(stallId, unpricedItemIds),
    enabled: unpricedItemIds.length > 0,
  });

  useEffect(() => {
    if (!lookedUpPrices || lookedUpPrices.length === 0) return;
    const byItem = new Map(lookedUpPrices.map((price) => [price.item_id, price]));
    if (!rows.some((row) => row.in_market === null && byItem.has(row.item_id))) return;
    onChange(
      rows.map((row) => {
        const price = row.in_market === null ? byItem.get(row.item_id) : undefined;
        return price
          ? {
              ...row,
              in_market: price.in_market,
              market_price:
                price.market_price !== null ? Number(price.market_price) : null,
            }
          : row;
      }),
    );
  }, [lookedUpPrices, rows, onChange]);

  function addItem(item: {
    id: number;
    name: string;
    unit: string | null;
    price: number | null;
    category: string | null;
  }) {
    onChange([
      ...rows,
      {
        key: nextRowKey(),
        item_id: item.id,
        item_name: item.name,
        kind: kindFromCategory(item.category),
        quantity: "1",
        unit_name: item.unit,
        is_optional: false,
        is_provided: false,
        note: "",
        in_market: true,
        market_price: item.price,
      },
    ]);
    setItemSearch("");
    setDebouncedItemSearch("");
  }

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    onChange(rows.filter((row) => row.key !== key));
  }

  const blockingRows = rows.filter(isBlockingRow);
  const batchCost = rows
    .filter((row) => !row.is_provided && row.market_price !== null)
    .reduce((sum, row) => sum + row.market_price! * Number(row.quantity || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Items to buy for this dish
        </h2>
        <p className="text-xs text-text-muted">
          List only what the stall needs bought — e.g. shrimp for sinigang. Quantities are
          for {batchLabel} and scale with the customer&apos;s order. Prices are live from{" "}
          {marketLabel} (before markup).
        </p>
      </div>

      <div className="relative flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text" htmlFor="dish-ingredient-search">
          Add an item sold at {marketLabel}
        </label>
        <input
          id="dish-ingredient-search"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Search items by name, e.g. shrimp…"
          className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        {debouncedItemSearch.length > 1 && (
          <div className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lifted">
            {itemsFetching && (
              <div className="flex justify-center p-3">
                <Spinner />
              </div>
            )}
            {!itemsFetching && itemResults && itemResults.data.length === 0 && (
              <p className="p-3 text-sm text-text-muted">
                No matching items at this market.
              </p>
            )}
            {!itemsFetching &&
              itemResults?.data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    addItem({
                      id: item.id,
                      name: item.name,
                      unit: item.unit,
                      price: item.market?.price ?? null,
                      category: item.category,
                    })
                  }
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-background"
                >
                  <span className="font-medium text-text">{item.name}</span>
                  <span className="text-xs text-text-muted">
                    {item.market?.price != null
                      ? `${formatPeso(Number(item.market.price))} / ${item.unit ?? "unit"}`
                      : "No price yet"}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
          No items yet. Search above to add what the stall needs bought. Customers
          can&apos;t order this dish until it has at least one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Market price</th>
                <th className="px-3 py-2">Line cost</th>
                <th className="px-3 py-2">Optional</th>
                <th
                  className="px-3 py-2"
                  title="Shown to the customer as included — not bought or charged"
                >
                  Stall provides
                </th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const blocking = isBlockingRow(row);
                const lineCost =
                  row.market_price !== null && !row.is_provided
                    ? row.market_price * Number(row.quantity || 0)
                    : null;
                return (
                  <tr key={row.key} className={blocking ? "bg-red-50" : undefined}>
                    <td className="px-3 py-2">
                      <span className="font-medium text-text">{row.item_name}</span>
                      {row.in_market === false && (
                        <span className="block text-xs font-semibold text-status-cancelled">
                          Not sold at this market
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        title="Set from the item's category"
                        className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {KIND_LABELS[row.kind]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {/* Unit is locked to the item's own selling unit — cost is quantity ×
                          the item's per-unit market price, with no conversion. */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(row.key, { quantity: e.target.value })
                          }
                          aria-label={`Quantity of ${row.item_name}`}
                          className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <span className="text-xs text-text-muted">
                          {row.unit_name ?? ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {row.in_market === null
                        ? "…"
                        : row.market_price !== null
                          ? formatPeso(row.market_price)
                          : "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {row.is_provided
                        ? "Stall"
                        : lineCost !== null
                          ? formatPeso(lineCost)
                          : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.is_optional}
                        onChange={(e) =>
                          updateRow(row.key, { is_optional: e.target.checked })
                        }
                        aria-label={`${row.item_name} is optional`}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.is_provided}
                        onChange={(e) =>
                          updateRow(row.key, { is_provided: e.target.checked })
                        }
                        aria-label={`${row.item_name} is provided by the stall`}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) => updateRow(row.key, { note: e.target.value })}
                        placeholder="Optional note"
                        aria-label={`Note for ${row.item_name}`}
                        className="h-9 w-32 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="text-xs font-medium text-status-cancelled"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <p className="text-sm text-text">
          Ingredient cost per {batchLabel}: <strong>{formatPeso(batchCost)}</strong>
          <span className="text-text-muted"> + cooking fee, before markup</span>
        </p>
      )}

      {blockingRows.length > 0 && (
        <p className="text-sm text-status-cancelled">
          {blockingRows.map((row) => row.item_name).join(", ")}{" "}
          {blockingRows.length === 1 ? "isn't" : "aren't"} sold at this market. Remove{" "}
          {blockingRows.length === 1 ? "it" : "them"}, or mark as optional or provided by
          the stall.
        </p>
      )}
    </div>
  );
}
