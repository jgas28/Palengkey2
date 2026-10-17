import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  downloadAdminItemImportTemplate,
  importAdminItemsCsv,
} from "@/services/api/adminItems";
import { useToastStore } from "@/stores/toastStore";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** "Import CSV" on the Items page — batch-creates catalog items, then points to Inventory for prices. */
/** `trigger` replaces the default small button (e.g. a styled page-header button). */
export default function ItemCsvImport({
  trigger,
}: {
  trigger?: (open: () => void) => ReactNode;
}) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);

  const importMutation = useMutation({
    mutationFn: () => importAdminItemsCsv(file!),
    onSuccess: (data) => {
      setResult({ created: data.created, errors: data.errors });
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not import the file.",
        "error",
      );
    },
  });

  async function handleTemplate() {
    setDownloading(true);
    try {
      saveBlob(await downloadAdminItemImportTemplate(), "items_import_template.csv");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download the template.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  }

  function close() {
    setOpen(false);
    setFile(null);
    setResult(null);
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Import CSV
        </Button>
      )}

      <Modal isOpen={open} onClose={close} title="Import items from CSV">
        <div className="flex flex-col gap-4 text-sm">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-text-muted">
            <li>
              Download the template and fill one item per row. Category, Type and Unit
              must match names in the admin (Unit can be &quot;kg&quot; or
              &quot;Kilogram&quot;).
            </li>
            <li>
              Upload it here. Items that already exist (same name + unit) are skipped.
            </li>
            <li>
              Then set prices per market in{" "}
              <Link
                to="/admin/inventory"
                className="font-medium text-primary hover:underline"
                onClick={close}
              >
                Inventory &amp; Pricing
              </Link>{" "}
              (it has its own CSV import), and add photos per item.
            </li>
          </ol>

          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            loading={downloading}
            onClick={() => void handleTemplate()}
          >
            Download template
          </Button>

          <label className="flex flex-col gap-1.5 font-medium text-text">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="text-sm font-normal text-text-muted"
            />
          </label>

          {result && (
            <div className="rounded-lg bg-background p-3">
              <p className="font-medium text-status-delivered">
                Created {result.created} item{result.created === 1 ? "" : "s"}.
              </p>
              {result.errors.length > 0 && (
                <>
                  <p className="mt-2 font-medium text-status-cancelled">
                    {result.errors.length} row{result.errors.length === 1 ? "" : "s"}{" "}
                    skipped:
                  </p>
                  <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-text-muted">
                    {result.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={close}>
              {result ? "Done" : "Cancel"}
            </Button>
            <Button
              disabled={!file}
              loading={importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
