import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminMarket,
  deactivateAdminMarket,
  listAdminMarketsFull,
  updateAdminMarket,
} from "@/services/api/adminMarkets";
import { useToastStore } from "@/stores/toastStore";
import type { AdminMarket, AdminMarketStatus } from "@/types/adminMarket";

const STATUS_LABELS: Record<AdminMarketStatus, string> = {
  1: "Active",
  2: "Coming soon",
  0: "Inactive",
};

const STATUS_COLOR: Record<AdminMarketStatus, string> = {
  1: "text-status-delivered",
  2: "text-status-preparing",
  0: "text-text-muted",
};

interface MarketFormState {
  name: string;
  location: string;
  address: string;
  latitude: string;
  longitude: string;
  status: AdminMarketStatus;
  cutoff_time: string;
  image: File | null;
}

const EMPTY_FORM: MarketFormState = {
  name: "",
  location: "",
  address: "",
  latitude: "",
  longitude: "",
  status: 1,
  cutoff_time: "17:00",
  image: null,
};

export default function AdminMarkets() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingMarket, setEditingMarket] = useState<AdminMarket | null>(null);
  const [form, setForm] = useState<MarketFormState>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminMarketsFull", search],
    queryFn: () => listAdminMarketsFull({ search: search || undefined }),
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(market: AdminMarket) {
    setEditingMarket(market);
    setForm({
      name: market.name,
      location: market.location,
      address: market.address,
      latitude: market.latitude,
      longitude: market.longitude,
      status: market.status,
      cutoff_time: market.cutoff_time ?? "17:00",
      image: null,
    });
  }

  function closeModals() {
    setShowCreate(false);
    setEditingMarket(null);
    setForm(EMPTY_FORM);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminMarket({
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        status: form.status,
        cutoff_time: form.cutoff_time,
        image: form.image ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminMarketsFull"] });
      void queryClient.invalidateQueries({ queryKey: ["adminMarkets"] });
      showToast("Market created.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not create market.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingMarket) throw new Error("No market selected.");
      return updateAdminMarket(editingMarket.id, {
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        status: form.status,
        cutoff_time: form.cutoff_time,
        image: form.image ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminMarketsFull"] });
      void queryClient.invalidateQueries({ queryKey: ["adminMarkets"] });
      showToast("Market updated.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update market.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (market: AdminMarket) => deactivateAdminMarket(market.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminMarketsFull"] });
      void queryClient.invalidateQueries({ queryKey: ["adminMarkets"] });
      showToast("Market deactivated.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not deactivate market.", "error");
    },
  });

  const isFormValid =
    form.name.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.latitude.trim().length > 0 &&
    form.longitude.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Markets</h1>
        <Button size="sm" onClick={openCreate}>
          Add market
        </Button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, location, address..."
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState title="No markets yet." description="Add a market to start listing items." />
      )}

      {data && data.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {data.data.map((market) => (
            <li key={market.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => openEdit(market)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                {market.image_url ? (
                  <img
                    src={market.image_url}
                    alt={market.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                    {market.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-text">{market.name}</span>
                  <span className="text-xs text-text-muted">
                    {market.location} · Cutoff {market.cutoff_time}
                  </span>
                </div>
              </button>
              <span className={`text-xs font-semibold ${STATUS_COLOR[market.status]}`}>
                {STATUS_LABELS[market.status]}
              </span>
              {market.status !== 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate(market)}
                >
                  Deactivate
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={showCreate || editingMarket !== null}
        onClose={closeModals}
        title={editingMarket ? "Edit market" : "Add market"}
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
            Location (city/area)
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Full address
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Latitude
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Longitude
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Cutoff time
              <input
                type="time"
                value={form.cutoff_time}
                onChange={(e) => setForm((f) => ({ ...f, cutoff_time: e.target.value }))}
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: Number(e.target.value) as AdminMarketStatus }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value={1}>Active</option>
                <option value={2}>Coming soon</option>
                <option value={0}>Inactive</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            {editingMarket ? "Replace image (optional)" : "Cover image (optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))}
              className="text-sm text-text-muted"
            />
          </label>
          {editingMarket?.image_url && !form.image && (
            <img
              src={editingMarket.image_url}
              alt={editingMarket.name}
              className="h-24 w-24 rounded-card object-cover"
            />
          )}

          <Button
            loading={editingMarket ? updateMutation.isPending : createMutation.isPending}
            disabled={!isFormValid}
            onClick={() => (editingMarket ? updateMutation.mutate() : createMutation.mutate())}
          >
            {editingMarket ? "Save changes" : "Add market"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
