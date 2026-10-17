import { useState, type FormEvent, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Scale, Tag } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageToolbar,
  RowAction,
} from "@/components/admin/AdminManageList";
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

  const tabs = (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {(["types", "units"] as Tab[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setTab(value)}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize ${
            tab === value
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-600 hover:text-primary-700"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );

  return tab === "types" ? <TypesPanel tabs={tabs} /> : <UnitsPanel tabs={tabs} />;
}

function PanelShell({
  tabs,
  onAdd,
  addLabel,
  search,
  onSearch,
  placeholder,
  children,
}: {
  tabs: ReactNode;
  onAdd: () => void;
  addLabel: string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        title="Types & Units"
        description="Manage Palengkey types & units from one place."
        actionLabel={addLabel}
        onAction={onAdd}
      />
      <ManageToolbar search={search} onSearch={onSearch} placeholder={placeholder}>
        {tabs}
      </ManageToolbar>
      {children}
    </div>
  );
}

function itemsPill(count: number) {
  return (
    <ManagePill tone="info">
      {count} item{count === 1 ? "" : "s"}
    </ManagePill>
  );
}

function TypesPanel({ tabs }: { tabs: ReactNode }) {
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

  return (
    <PanelShell
      tabs={tabs}
      onAdd={openCreateForm}
      addLabel="Add type"
      search={search}
      onSearch={setSearch}
      placeholder="Search types"
    >
      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {data && data.data.length === 0 && (
        <Card>
          <EmptyPanel
            title="No types found."
            description="Types describe how an item is sold, like Fresh today or Dry goods."
          />
        </Card>
      )}
      {data && data.data.length > 0 && (
        <ManageList>
          {data.data.map((type) => (
            <ManageRow
              key={type.id}
              onOpen={() => openEditForm(type)}
              dimmed={!type.status}
              leading={<ManageIcon icon={<Tag size={18} />} />}
              title={type.name}
              subtitle="Product type"
              actions={
                type.status ? (
                  <RowAction
                    tone="danger"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(type.id)}
                  >
                    Deactivate
                  </RowAction>
                ) : (
                  <RowAction
                    tone="success"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(type.id)}
                  >
                    Restore
                  </RowAction>
                )
              }
              pills={
                <>
                  {itemsPill(type.active_items_count)}
                  {!type.status && <ManagePill tone="muted">Inactive</ManagePill>}
                </>
              }
            />
          ))}
        </ManageList>
      )}

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
    </PanelShell>
  );
}

function UnitsPanel({ tabs }: { tabs: ReactNode }) {
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

  return (
    <PanelShell
      tabs={tabs}
      onAdd={openCreateForm}
      addLabel="Add unit"
      search={search}
      onSearch={setSearch}
      placeholder="Search units"
    >
      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {data && data.data.length === 0 && (
        <Card>
          <EmptyPanel
            title="No units found."
            description="Units are how items are sold, like Kilogram or Piece."
          />
        </Card>
      )}
      {data && data.data.length > 0 && (
        <ManageList>
          {data.data.map((unit) => (
            <ManageRow
              key={unit.id}
              onOpen={() => openEditForm(unit)}
              dimmed={!unit.status}
              leading={<ManageIcon icon={<Scale size={18} />} />}
              title={unit.name}
              subtitle={`Selling unit · shown as “${unit.short_name}”`}
              actions={
                unit.status ? (
                  <RowAction
                    tone="danger"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(unit.id)}
                  >
                    Deactivate
                  </RowAction>
                ) : (
                  <RowAction
                    tone="success"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(unit.id)}
                  >
                    Restore
                  </RowAction>
                )
              }
              pills={
                <>
                  {itemsPill(unit.active_items_count)}
                  {!unit.status && <ManagePill tone="muted">Inactive</ManagePill>}
                </>
              }
            />
          ))}
        </ManageList>
      )}

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
    </PanelShell>
  );
}
