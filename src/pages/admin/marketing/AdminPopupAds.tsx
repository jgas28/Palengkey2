import { useState, type FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import AdminTable, {
  AdminStatusPill,
  AdminThumb,
  adminTd,
  adminTdStrong,
} from "@/components/admin/AdminTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminPopupAd,
  deleteAdminPopupAd,
  listAdminPopupAds,
  listPopupAdVouchers,
  updateAdminPopupAd,
  type PopupAdPayload,
} from "@/services/api/adminPopupAds";
import { useToastStore } from "@/stores/toastStore";
import type { AdminPopupAd, PopupAdType } from "@/types/adminPopupAd";

const TYPE_LABELS: Record<PopupAdType, string> = {
  promo: "Promo",
  voucher: "Voucher",
  advertisement: "Advertisement",
};

interface FormState {
  type: PopupAdType;
  voucher_id: number | "";
  title: string;
  subtitle: string;
  body: string;
  badge_text: string;
  cta_label: string;
  cta_url: string;
  image: File | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  sort_order: string;
}

const emptyForm: FormState = {
  type: "promo",
  voucher_id: "",
  title: "",
  subtitle: "",
  body: "",
  badge_text: "",
  cta_label: "",
  cta_url: "",
  image: null,
  is_active: true,
  starts_at: "",
  ends_at: "",
  sort_order: "0",
};

export default function AdminPopupAds() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPopupAd | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: page,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminPopupAds", search],
    queryFn: () => listAdminPopupAds(search),
    placeholderData: keepPreviousData,
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ["popupAdVouchers"],
    queryFn: listPopupAdVouchers,
  });

  function buildPayload(): PopupAdPayload {
    return {
      type: form.type,
      voucher_id: form.voucher_id ? Number(form.voucher_id) : undefined,
      title: form.title,
      subtitle: form.subtitle || undefined,
      body: form.body || undefined,
      badge_text: form.badge_text || undefined,
      cta_label: form.cta_label || undefined,
      cta_url: form.cta_url || undefined,
      image: form.image ?? undefined,
      is_active: form.is_active,
      starts_at: form.starts_at || undefined,
      ends_at: form.ends_at || undefined,
      sort_order: form.sort_order ? Number(form.sort_order) : undefined,
    };
  }

  const createMutation = useMutation({
    mutationFn: () => createAdminPopupAd(buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPopupAds"] });
      showToast("Popup ad created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create popup ad.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminPopupAd(editing!.id, buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPopupAds"] });
      showToast("Popup ad updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update popup ad.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminPopupAd(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPopupAds"] });
      showToast("Popup ad deleted.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not delete popup ad.",
        "error",
      );
    },
  });

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(ad: AdminPopupAd) {
    setEditing(ad);
    setForm({
      type: ad.type,
      voucher_id: ad.voucher_id ?? "",
      title: ad.title,
      subtitle: ad.subtitle ?? "",
      body: ad.body ?? "",
      badge_text: ad.badge_text ?? "",
      cta_label: ad.cta_label ?? "",
      cta_url: ad.cta_url ?? "",
      image: null,
      is_active: ad.is_active,
      starts_at: ad.starts_at?.slice(0, 16) ?? "",
      ends_at: ad.ends_at?.slice(0, 16) ?? "",
      sort_order: String(ad.sort_order),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing && !form.image) {
      showToast("Add an image.", "error");
      return;
    }
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !page) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search popup ads…"
          className="h-10 w-64 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <Button size="sm" onClick={openCreateForm}>
          Add popup ad
        </Button>
      </div>

      <AdminTable head={["Popup", "Type", "Schedule", "Status", ""]}>
        {page.data.map((ad) => (
          <tr key={ad.id} className="hover:bg-background/60">
            <td className={adminTdStrong}>
              <button
                type="button"
                onClick={() => openEditForm(ad)}
                className="flex items-center gap-3 text-left hover:text-primary"
              >
                <AdminThumb src={ad.image_url} />
                <span className="line-clamp-2">{ad.title}</span>
              </button>
            </td>
            <td className={adminTd}>{TYPE_LABELS[ad.type]}</td>
            <td className={adminTd}>
              {ad.starts_at || ad.ends_at
                ? `${ad.starts_at ? new Date(ad.starts_at).toLocaleDateString("en-PH") : "Now"} – ${
                    ad.ends_at
                      ? new Date(ad.ends_at).toLocaleDateString("en-PH")
                      : "No end"
                  }`
                : "Always"}
            </td>
            <td className={adminTd}>
              <AdminStatusPill active={ad.is_active} />
            </td>
            <td className="px-4 py-3 text-right">
              <button
                type="button"
                onClick={() => openEditForm(ad)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit popup ad" : "Add popup ad"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PopupAdType })}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {(Object.keys(TYPE_LABELS) as PopupAdType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Linked voucher (optional)
            <select
              value={form.voucher_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  voucher_id: e.target.value ? Number(e.target.value) : "",
                })
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">None</option>
              {vouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.code}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Subtitle (optional)"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Body (optional)
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={2}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <Input
            label="Badge text (optional)"
            value={form.badge_text}
            onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CTA label (optional)"
              value={form.cta_label}
              onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            />
            <Input
              label="CTA URL (optional)"
              value={form.cta_url}
              onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            />
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            {editing ? "Replace image (optional)" : "Image"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
              className="text-sm text-text-muted"
            />
          </label>
          {editing && (
            <img
              src={editing.image_url}
              alt={editing.title}
              className="h-24 w-full rounded-card object-cover"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Starts at (optional)"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
            <Input
              label="Ends at (optional)"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>

          <Input
            label="Sort order"
            type="number"
            min="0"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save changes" : "Create popup ad"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete "${editing.title}"?`)) {
                    deleteMutation.mutate(editing.id);
                    closeForm();
                  }
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
