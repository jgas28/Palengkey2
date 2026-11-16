import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const field =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100";

export interface CopyTarget {
  id: number;
  label: string;
}

/**
 * "Copy" for recipes and Paluto dishes: a new name and, for dishes, which
 * stall's menu to copy onto. The copy is saved deactivated.
 */
export default function CopyDialog({
  isOpen,
  title,
  initialName,
  targets,
  initialTargetId,
  targetLabel = "Copy to",
  isSaving,
  onClose,
  onCopy,
}: {
  isOpen: boolean;
  title: string;
  initialName: string;
  /** When given, the admin picks where the copy goes (e.g. a stall). */
  targets?: CopyTarget[];
  initialTargetId?: number;
  targetLabel?: string;
  isSaving: boolean;
  onClose: () => void;
  onCopy: (name: string, targetId?: number) => void;
}) {
  const [name, setName] = useState(initialName);
  const [targetId, setTargetId] = useState<number | undefined>(initialTargetId);

  const trimmed = name.trim();
  const canSave = trimmed !== "" && (!targets || targetId !== undefined) && !isSaving;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canSave) onCopy(trimmed, targetId);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {targets && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {targetLabel}
            <select
              value={targetId ?? ""}
              onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : undefined)}
              className={field}
            >
              <option value="">Choose…</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Name of the copy
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            className={field}
            autoFocus
          />
        </label>

        <p className="text-xs text-slate-500">
          Everything is copied, including the ingredients. The copy starts
          deactivated: adjust it, then turn it on.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSave}>
            {isSaving ? "Copying…" : "Make copy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
