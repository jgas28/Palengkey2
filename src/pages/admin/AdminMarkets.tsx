import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Store } from "lucide-react";
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

const STATUS_TONE: Record<AdminMarketStatus, "active" | "warning" | "muted"> = {
  1: "active",
  2: "warning",
  0: "muted",
};

/** "17:00" → "5:00 PM". */
function clock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

interface MarketFormState {
  name: string;
  location: string;
  address: string;
  latitude: string;
  longitude: string;
  status: AdminMarketStatus;
  cutoff_time: string;
  cutoff_timezone: string;
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
  cutoff_timezone: "Asia/Manila",
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
    placeholderData: keepPreviousData,
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
      cutoff_timezone: market.cutoff_timezone ?? "Asia/Manila",
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
        cutoff_timezone: form.cutoff_timezone,
        image: form.image ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminMarketsFull"] });
      void queryClient.invalidateQueries({ queryKey: ["adminMarkets"] });
      showToast("Market created.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create market.",
        "error",
      );
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
        cutoff_timezone: form.cutoff_timezone,
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
      showToast(
        error instanceof Error ? error.message : "Could not update market.",
        "error",
      );
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
      showToast(
        error instanceof Error ? error.message : "Could not deactivate market.",
        "error",
      );
    },
  });

  const isFormValid =
    form.name.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.latitude.trim().length > 0 &&
    form.longitude.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        title="Markets"
        description="Manage Palengkey markets from one place."
        onAction={openCreate}
      />

      <ManageToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search name, location, address"
      />

      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <Card>
          <EmptyPanel
            title={search ? "No markets match." : "No markets yet."}
            description="Add a market to start listing items."
          />
        </Card>
      )}

      {data && data.data.length > 0 && (
        <ManageList>
          {data.data.map((market) => (
            <ManageRow
              key={market.id}
              onOpen={() => openEdit(market)}
              dimmed={market.status === 0}
              leading={<ManageIcon icon={<Store size={18} />} image={market.image_url} />}
              title={market.name}
              subtitle={[
                market.location,
                market.cutoff_time ? `Cutoff ${clock(market.cutoff_time)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                market.status !== 0 ? (
                  <RowAction
                    tone="danger"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(market)}
                  >
                    Deactivate
                  </RowAction>
                ) : undefined
              }
              pills={
                <ManagePill tone={STATUS_TONE[market.status]}>
                  {STATUS_LABELS[market.status]}
                </ManagePill>
              }
            />
          ))}
        </ManageList>
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
              Cutoff timezone
              <select
                value={form.cutoff_timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cutoff_timezone: e.target.value }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="Asia/Manila">Asia/Manila (PH)</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: Number(e.target.value) as AdminMarketStatus,
                  }))
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
              onChange={(e) =>
                setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))
              }
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
            onClick={() =>
              editingMarket ? updateMutation.mutate() : createMutation.mutate()
            }
          >
            {editingMarket ? "Save changes" : "Add market"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
