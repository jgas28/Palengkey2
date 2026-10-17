import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminPalutoStall,
  deactivateAdminPalutoStall,
  listAdminPalutoStalls,
  restoreAdminPalutoStall,
  updateAdminPalutoStall,
} from "@/services/api/adminPalutoStalls";
import { listAdminMarkets } from "@/services/api/adminLookups";
import { useToastStore } from "@/stores/toastStore";
import type { AdminPalutoStall } from "@/types/adminPalutoStall";
import { ChefHat } from "lucide-react";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  RowAction,
} from "@/components/admin/AdminManageList";

interface StallFormState {
  name: string;
  market_id: number | "";
  description: string;
  contact_phone: string;
  is_accepting_orders: boolean;
  prep_time_minutes: string;
  image: File | null;
}

const EMPTY_FORM: StallFormState = {
  name: "",
  market_id: "",
  description: "",
  contact_phone: "",
  is_accepting_orders: true,
  prep_time_minutes: "",
  image: null,
};

export default function AdminPalutoStalls() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [marketId, setMarketId] = useState<number | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [editingStall, setEditingStall] = useState<AdminPalutoStall | null>(null);
  const [form, setForm] = useState<StallFormState>(EMPTY_FORM);

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminPalutoStalls", search, marketId],
    queryFn: () => listAdminPalutoStalls({ search: search || undefined, marketId }),
    placeholderData: keepPreviousData,
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(stall: AdminPalutoStall) {
    setEditingStall(stall);
    setForm({
      name: stall.name,
      market_id: stall.market_id,
      description: stall.description ?? "",
      contact_phone: stall.contact_phone ?? "",
      is_accepting_orders: stall.is_accepting_orders,
      prep_time_minutes: stall.prep_time_minutes?.toString() ?? "",
      image: null,
    });
  }

  function closeModals() {
    setShowCreate(false);
    setEditingStall(null);
    setForm(EMPTY_FORM);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminPalutoStall({
        name: form.name.trim(),
        market_id: Number(form.market_id),
        description: form.description.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        is_accepting_orders: form.is_accepting_orders,
        prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null,
        image: form.image ?? undefined,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoStalls"] });
      showToast("Stall created. Now add the dishes on its menu.", "success");
      closeModals();
      navigate(`/admin/paluto-stalls/${created.id}/dishes`);
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create stall.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingStall) throw new Error("No stall selected.");
      return updateAdminPalutoStall(editingStall.id, {
        name: form.name.trim(),
        market_id: Number(form.market_id),
        description: form.description.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        is_accepting_orders: form.is_accepting_orders,
        prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null,
        image: form.image ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoStalls"] });
      showToast("Paluto stall updated.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update stall.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (stall: AdminPalutoStall) => deactivateAdminPalutoStall(stall.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoStalls"] });
      showToast("Stall deactivated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate stall.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (stall: AdminPalutoStall) => restoreAdminPalutoStall(stall.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoStalls"] });
      showToast("Stall restored.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not restore stall.",
        "error",
      );
    },
  });

  function handleDeactivate(stall: AdminPalutoStall) {
    const confirmed = window.confirm(
      `Deactivate "${stall.name}"? It will stop accepting new orders immediately. ` +
        "This won't affect orders already placed.",
    );
    if (confirmed) deactivateMutation.mutate(stall);
  }

  const isFormValid = form.name.trim().length > 0 && form.market_id !== "";

  return (
    <div className="flex flex-col gap-4">
      <ManageHeader
        eyebrow="Paluto & recipes"
        title="Paluto stalls"
        description="Cooking stalls and the dishes they cook from market ingredients."
        actionLabel="Add stall"
        onAction={openCreate}
      />

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stall name..."
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={marketId ?? ""}
          onChange={(e) =>
            setMarketId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">All markets</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState
          title="No paluto stalls yet."
          description="Add a stall, then build its menu: each dish with its own ingredients and cooking fee."
        />
      )}

      {data && data.data.length > 0 && (
        <ManageList>
          {data.data.map((stall) => (
            <ManageRow
              key={stall.id}
              onOpen={() => navigate(`/admin/paluto-stalls/${stall.id}/dishes`)}
              dimmed={!stall.status}
              leading={
                <ManageIcon icon={<ChefHat size={18} />} image={stall.image_url} />
              }
              title={stall.name}
              subtitle={[
                stall.market_name ?? "No market",
                stall.prep_time_minutes ? `~${stall.prep_time_minutes} min prep` : null,
                `${stall.dishes_count} dish${stall.dishes_count === 1 ? "" : "es"} on the menu`,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(stall)}
                    className="text-primary-700 hover:underline"
                  >
                    Edit stall
                  </button>
                  {stall.status ? (
                    <RowAction
                      tone="danger"
                      disabled={deactivateMutation.isPending}
                      onClick={() => handleDeactivate(stall)}
                    >
                      Deactivate
                    </RowAction>
                  ) : (
                    <RowAction
                      tone="success"
                      disabled={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(stall)}
                    >
                      Restore
                    </RowAction>
                  )}
                </>
              }
              pills={
                <>
                  <ManagePill tone={stall.is_accepting_orders ? "active" : "warning"}>
                    {stall.is_accepting_orders ? "Accepting orders" : "Paused"}
                  </ManagePill>
                  {!stall.status && <ManagePill tone="muted">Inactive</ManagePill>}
                </>
              }
            />
          ))}
        </ManageList>
      )}

      <Modal
        isOpen={showCreate || editingStall !== null}
        onClose={closeModals}
        title={editingStall ? "Edit paluto stall" : "Add paluto stall"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Market
            <select
              value={form.market_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  market_id: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Select a market</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Contact phone
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_phone: e.target.value }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Prep time (minutes)
              <input
                type="number"
                min="0"
                value={form.prep_time_minutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prep_time_minutes: e.target.value }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={form.is_accepting_orders}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_accepting_orders: e.target.checked }))
              }
            />
            Accepting orders
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            {editingStall ? "Replace image (optional)" : "Cover image (optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))
              }
              className="text-sm text-text-muted"
            />
          </label>
          {editingStall?.image_url && !form.image && (
            <img
              src={editingStall.image_url}
              alt={editingStall.name}
              className="h-24 w-24 rounded-card object-cover"
            />
          )}

          <Button
            loading={editingStall ? updateMutation.isPending : createMutation.isPending}
            disabled={!isFormValid}
            onClick={() =>
              editingStall ? updateMutation.mutate() : createMutation.mutate()
            }
          >
            {editingStall ? "Save changes" : "Add stall"}
          </Button>

          {editingStall && (
            <Link
              to={`/admin/paluto-stalls/${editingStall.id}/dishes`}
              className="text-center text-sm font-medium text-primary"
            >
              Manage this stall&apos;s menu and ingredients →
            </Link>
          )}
        </div>
      </Modal>
    </div>
  );
}
