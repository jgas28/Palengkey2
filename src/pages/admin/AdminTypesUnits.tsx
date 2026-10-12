import { useState, type FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminType,
  createAdminUnit,
  deactivateAdminType,
  deactivateAdminUnit,
  listAdminTypes,
  listAdminUnits,
  restoreAdminType,
  restoreAdminUnit,
  updateAdminType,
  updateAdminUnit,
} from "@/services/api/adminTypesUnits";
import { useToastStore } from "@/stores/toastStore";
import type { AdminProductType, AdminUnit } from "@/types/adminTypeUnit";

type Tab = "types" | "units";

export default function AdminTypesUnits() {
  const [tab, setTab] = useState<Tab>("types");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Types &amp; Units</h1>

      <div className="flex gap-1 border-b border-border">
        {(["types", "units"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium capitalize ${
              tab === value
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "types" ? <TypesPanel /> : <UnitsPanel />}
    </div>
  );
}

function TypesPanel() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductType | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminTypes", search],
    queryFn: () => listAdminTypes({ search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminType(name.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminTypes"] });
      void queryClient.invalidateQueries({ queryKey: ["adminTypesLookup"] });
      showToast("Type created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create type.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminType(editing!.id, name.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminTypes"] });
      showToast("Type updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update type.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (typeId: number) => deactivateAdminType(typeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminTypes"] });
      showToast("Type deactivated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate type.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (typeId: number) => restoreAdminType(typeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminTypes"] });
      showToast("Type restored.", "success");
    },
  });

  function openCreateForm() {
    setEditing(null);
    setName("");
    setFormOpen(true);
  }

  function openEditForm(type: AdminProductType) {
    setEditing(type);
    setName(type.name);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search types..."
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button size="sm" onClick={openCreateForm}>
          Add type
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
        {data.data.map((type) => (
          <li key={type.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => openEditForm(type)}
              className="flex-1 text-left"
            >
              <span className="font-medium text-text">{type.name}</span>
              <span className="ml-2 text-xs text-text-muted">
                {type.active_items_count} active item
                {type.active_items_count === 1 ? "" : "s"}
              </span>
            </button>
            <span
              className={`text-xs font-semibold ${type.status ? "text-status-delivered" : "text-text-muted"}`}
            >
              {type.status ? "Active" : "Inactive"}
            </span>
            {type.status ? (
              <Button
                variant="secondary"
                size="sm"
                loading={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate(type.id)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                loading={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(type.id)}
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit type" : "Add type"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save changes" : "Create type"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function UnitsPanel() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUnit | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminUnits", search],
    queryFn: () => listAdminUnits({ search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminUnit(name.trim(), shortName.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUnits"] });
      void queryClient.invalidateQueries({ queryKey: ["adminUnitsLookup"] });
      showToast("Unit created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create unit.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminUnit(editing!.id, name.trim(), shortName.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUnits"] });
      showToast("Unit updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update unit.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (unitId: number) => deactivateAdminUnit(unitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUnits"] });
      showToast("Unit deactivated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate unit.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (unitId: number) => restoreAdminUnit(unitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUnits"] });
      showToast("Unit restored.", "success");
    },
  });

  function openCreateForm() {
    setEditing(null);
    setName("");
    setShortName("");
    setFormOpen(true);
  }

  function openEditForm(unit: AdminUnit) {
    setEditing(unit);
    setName(unit.name);
    setShortName(unit.short_name);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setShortName("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search units..."
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button size="sm" onClick={openCreateForm}>
          Add unit
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
        {data.data.map((unit) => (
          <li key={unit.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => openEditForm(unit)}
              className="flex-1 text-left"
            >
              <span className="font-medium text-text">
                {unit.name} <span className="text-text-muted">({unit.short_name})</span>
              </span>
              <span className="ml-2 text-xs text-text-muted">
                {unit.active_items_count} active item
                {unit.active_items_count === 1 ? "" : "s"}
              </span>
            </button>
            <span
              className={`text-xs font-semibold ${unit.status ? "text-status-delivered" : "text-text-muted"}`}
            >
              {unit.status ? "Active" : "Inactive"}
            </span>
            {unit.status ? (
              <Button
                variant="secondary"
                size="sm"
                loading={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate(unit.id)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                loading={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(unit.id)}
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit unit" : "Add unit"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Short name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="kg, g, pc, ..."
            required
          />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save changes" : "Create unit"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
