import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listAdminMarkets } from "@/services/api/adminLookups";
import {
  createAdminRider,
  listAdminRiders,
  updateAdminRider,
} from "@/services/api/adminRiders";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useToastStore } from "@/stores/toastStore";
import type { AdminRider } from "@/types/adminRider";

interface RiderFormState {
  name: string;
  phone: string;
  vehicle_type: string;
  market_id: string;
}

const EMPTY_FORM: RiderFormState = { name: "", phone: "", vehicle_type: "", market_id: "" };

export default function AdminRiders() {
  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingRider, setEditingRider] = useState<AdminRider | null>(null);
  const [form, setForm] = useState<RiderFormState>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminRiders", search],
    queryFn: () => listAdminRiders(search || undefined),
  });

  const { data: markets } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin && showCreate,
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(rider: AdminRider) {
    setEditingRider(rider);
    setForm({
      name: rider.name,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type,
      market_id: String(rider.market_id),
    });
  }

  function closeModals() {
    setShowCreate(false);
    setEditingRider(null);
    setForm(EMPTY_FORM);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminRider({
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type.trim(),
        market_id: isSuperAdmin ? Number(form.market_id) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      showToast("Rider added.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add rider.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingRider) throw new Error("No rider selected.");
      return updateAdminRider(editingRider.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type.trim(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      showToast("Rider updated.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update rider.", "error");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (rider: AdminRider) => updateAdminRider(rider.id, { is_active: !rider.is_active }),
    onSuccess: (_data, rider) => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      showToast(rider.is_active ? "Rider deactivated." : "Rider activated.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update rider.", "error");
    },
  });

  function handleToggleActive(rider: AdminRider) {
    if (rider.is_active && rider.active_orders_count > 0) {
      const confirmed = window.confirm(
        `${rider.name} has ${rider.active_orders_count} active order(s) in progress. ` +
          "Deactivating them now won't reassign those orders. Continue?",
      );
      if (!confirmed) return;
    }
    toggleActiveMutation.mutate(rider);
  }

  const isFormValid =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.vehicle_type.trim().length > 0 &&
    (!isSuperAdmin || !showCreate || form.market_id !== "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Riders</h1>
        <Button size="sm" onClick={openCreate}>
          Add rider
        </Button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or phone..."
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState title="No riders yet." description="Add a rider to start assigning deliveries." />
      )}

      {data && data.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {data.data.map((rider) => (
            <li key={rider.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => openEdit(rider)}
                className="flex flex-1 flex-col items-start gap-0.5 text-left"
              >
                <span className="font-medium text-text">{rider.name}</span>
                <span className="text-xs text-text-muted">
                  {rider.phone} · {rider.vehicle_type}
                  {rider.market && ` · ${rider.market.name}`}
                  {rider.active_orders_count > 0 && ` · ${rider.active_orders_count} active order(s)`}
                </span>
              </button>
              <span
                className={`text-xs font-semibold ${
                  rider.is_active ? "text-status-delivered" : "text-text-muted"
                }`}
              >
                {rider.is_active ? "Active" : "Inactive"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                loading={toggleActiveMutation.isPending}
                onClick={() => handleToggleActive(rider)}
              >
                {rider.is_active ? "Deactivate" : "Activate"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={showCreate || editingRider !== null}
        onClose={closeModals}
        title={editingRider ? "Edit rider" : "Add rider"}
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
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Vehicle type
            <input
              type="text"
              value={form.vehicle_type}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}
              placeholder="motorcycle, bicycle, ..."
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          {isSuperAdmin && showCreate && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Market
              <select
                value={form.market_id}
                onChange={(e) => setForm((f) => ({ ...f, market_id: e.target.value }))}
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select a market</option>
                {markets?.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <Button
            loading={editingRider ? updateMutation.isPending : createMutation.isPending}
            disabled={!isFormValid}
            onClick={() => (editingRider ? updateMutation.mutate() : createMutation.mutate())}
          >
            {editingRider ? "Save changes" : "Add rider"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
