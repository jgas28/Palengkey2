import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  downloadAdminInventoryTemplate,
  getAdminInventoryBoard,
  importAdminInventoryCsv,
  updateAdminInventoryBoard,
  type InventoryRowUpdate,
} from "@/services/api/adminInventory";
import { listAdminMarkets } from "@/services/api/adminLookups";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useToastStore } from "@/stores/toastStore";
import type { AdminInventoryRow } from "@/types/adminInventory";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminInventory() {
  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [marketId, setMarketId] = useState<number | undefined>(
    user?.market_id ?? undefined,
  );
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<number, InventoryRowUpdate>>({});
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<{
    updated: number;
    errors: string[];
  } | null>(null);

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminInventory", marketId],
    queryFn: () => getAdminInventoryBoard(marketId),
    enabled: !isSuperAdmin || marketId !== undefined,
  });

  useEffect(() => {
    setEdits({});
    setImportSummary(null);
  }, [marketId]);

  function rowFor(row: AdminInventoryRow): InventoryRowUpdate {
    return (
      edits[row.item_id] ?? {
        item_id: row.item_id,
        price: row.price ? Number(row.price) : null,
        is_available: row.is_available,
        cutoff_time: row.cutoff_time,
      }
    );
  }

  function updateRow(row: AdminInventoryRow, patch: Partial<InventoryRowUpdate>) {
    setEdits((prev) => ({ ...prev, [row.item_id]: { ...rowFor(row), ...patch } }));
  }

  const saveMutation = useMutation({
    mutationFn: () => updateAdminInventoryBoard(Object.values(edits), marketId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["adminInventory", marketId] });
      setEdits({});
      showToast(
        result.errors.length > 0
          ? `Updated ${result.updated} item(s), ${result.errors.length} error(s).`
          : `Updated ${result.updated} item(s).`,
        result.errors.length > 0 ? "error" : "success",
      );
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save changes.",
        "error",
      );
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!importFile) throw new Error("Choose a CSV file first.");
      return importAdminInventoryCsv(importFile, marketId);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["adminInventory", marketId] });
      setImportSummary({ updated: result.updated, errors: result.errors });
      setImportFile(null);
      showToast(`Imported: ${result.updated} item(s) updated.`, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not import CSV.",
        "error",
      );
    },
  });

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const blob = await downloadAdminInventoryTemplate(marketId);
      triggerDownload(blob, `inventory_template_market_${marketId ?? "all"}.csv`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download template.",
        "error",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.items;
    const needle = search.trim().toLowerCase();
    return data.items.filter((row) => row.name.toLowerCase().includes(needle));
  }, [data, search]);

  const changedCount = Object.keys(edits).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Inventory &amp; Pricing</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={downloadingTemplate}
            disabled={marketId === undefined}
            onClick={() => void handleDownloadTemplate()}
          >
            Download CSV
          </Button>
          <Button
            loading={saveMutation.isPending}
            disabled={changedCount === 0}
            onClick={() => saveMutation.mutate()}
          >
            Save changes {changedCount > 0 && `(${changedCount})`}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {isSuperAdmin && (
          <select
            value={marketId ?? ""}
            onChange={(e) =>
              setMarketId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">Choose a market</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          className="text-sm text-text-muted"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!importFile}
          loading={importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          Import CSV
        </Button>
      </div>

      {importSummary && importSummary.errors.length > 0 && (
        <div className="rounded-lg border border-status-cancelled/30 bg-status-cancelled/5 p-3 text-sm text-status-cancelled">
          <p className="font-medium">{importSummary.errors.length} row(s) had issues:</p>
          <ul className="mt-1 list-disc pl-5">
            {importSummary.errors.slice(0, 10).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {isSuperAdmin && marketId === undefined && (
        <p className="text-sm text-text-muted">
          Choose a market above to manage its inventory.
        </p>
      )}

      {marketId !== undefined && isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Cutoff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((row) => {
                const current = rowFor(row);
                const isDirty = Boolean(edits[row.item_id]);
                return (
                  <tr key={row.item_id} className={isDirty ? "bg-primary-50" : undefined}>
                    <td className="px-4 py-2 font-medium text-text">{row.name}</td>
                    <td className="px-4 py-2 text-text-muted">{row.unit}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={current.price ?? ""}
                        onChange={(e) =>
                          updateRow(row, {
                            price: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={current.is_available}
                        onChange={(e) =>
                          updateRow(row, { is_available: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        value={current.cutoff_time ?? ""}
                        onChange={(e) =>
                          updateRow(row, { cutoff_time: e.target.value || null })
                        }
                        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                    No items match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
