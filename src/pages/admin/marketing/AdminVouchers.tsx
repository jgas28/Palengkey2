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
import { Plus, Ticket } from "lucide-react";
import { Card, EmptyPanel } from "@/components/admin/AdminUi";
import {
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageToolbar,
  RowAction,
} from "@/components/admin/AdminManageList";
import {
  createAdminVoucher,
  deleteAdminVoucher,
  listAdminVouchers,
  updateAdminVoucher,
  type VoucherPayload,
} from "@/services/api/adminVouchers";
import { listAdminMarkets } from "@/services/api/adminLookups";
import AdminStepper from "@/components/admin/AdminStepper";
import { useToastStore } from "@/stores/toastStore";
import type { AdminVoucher, VoucherTarget } from "@/types/adminVoucher";

const TARGET_LABELS: Record<VoucherTarget, string> = {
  subtotal: "Items subtotal",
  service_fee: "Service fee",
  delivery_fee: "Delivery fee",
};

interface FormState {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  applies_to: VoucherTarget[];
  min_order_amount: string;
  max_discount_amount: string;
  usage_limit: string;
  per_customer_limit: string;
  is_active: boolean;
  is_public: boolean;
  market_id: number | "";
  starts_at: string;
  expires_at: string;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  applies_to: ["subtotal"],
  min_order_amount: "",
  max_discount_amount: "",
  usage_limit: "",
  per_customer_limit: "1",
  is_active: true,
  is_public: true,
  market_id: "",
  starts_at: "",
  expires_at: "",
};

const VOUCHER_STEPS = [
  { id: 1, title: "Discount", hint: "" },
  { id: 2, title: "Limits", hint: "" },
  { id: 3, title: "Schedule", hint: "" },
] as const;

export default function AdminVouchers() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formStep, setFormStep] = useState(1);
  const discountValid = Boolean(
    form.code.trim() && Number(form.discount_value) > 0 && form.applies_to.length,
  );

  const {
    data: page,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminVouchers", search],
    queryFn: () => listAdminVouchers(search),
    placeholderData: keepPreviousData,
  });

  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
  });

  function buildPayload(): VoucherPayload {
    return {
      code: form.code,
      description: form.description || undefined,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      applies_to: form.applies_to,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
      max_discount_amount: form.max_discount_amount
        ? Number(form.max_discount_amount)
        : undefined,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
      per_customer_limit: form.per_customer_limit
        ? Number(form.per_customer_limit)
        : undefined,
      is_active: form.is_active,
      is_public: form.is_public,
      market_id: form.market_id ? Number(form.market_id) : undefined,
      starts_at: form.starts_at || undefined,
      expires_at: form.expires_at || undefined,
    };
  }

  const createMutation = useMutation({
    mutationFn: () => createAdminVoucher(buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      showToast("Voucher created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create voucher.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminVoucher(editing!.id, buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      showToast("Voucher updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update voucher.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (voucherId: number) => deleteAdminVoucher(voucherId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      showToast("Voucher deleted.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not delete voucher.",
        "error",
      );
    },
  });

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormStep(1);
    setFormOpen(true);
  }

  function openEditForm(voucher: AdminVoucher) {
    setEditing(voucher);
    setForm({
      code: voucher.code,
      description: voucher.description ?? "",
      discount_type: voucher.discount_type,
      discount_value: String(voucher.discount_value),
      applies_to: voucher.applies_to,
      min_order_amount: voucher.min_order_amount?.toString() ?? "",
      max_discount_amount: voucher.max_discount_amount?.toString() ?? "",
      usage_limit: voucher.usage_limit?.toString() ?? "",
      per_customer_limit: String(voucher.per_customer_limit),
      is_active: voucher.is_active,
      is_public: voucher.is_public,
      market_id: voucher.market_id ?? "",
      starts_at: voucher.starts_at?.slice(0, 16) ?? "",
      expires_at: voucher.expires_at?.slice(0, 16) ?? "",
    });
    setFormStep(1);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function toggleTarget(target: VoucherTarget) {
    setForm((prev) => ({
      ...prev,
      applies_to: prev.applies_to.includes(target)
        ? prev.applies_to.filter((t) => t !== target)
        : [...prev.applies_to, target],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (formStep < VOUCHER_STEPS.length) {
      if (formStep === 1 && !discountValid) {
        showToast("Add a code, a discount and at least one target.", "error");
        return;
      }
      setFormStep(formStep + 1);
      return;
    }
    if (form.applies_to.length === 0) {
      showToast("Choose at least one target.", "error");
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
      <ManageToolbar search={search} onSearch={setSearch} placeholder="Search vouchers">
        <button
          type="button"
          onClick={openCreateForm}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus size={16} aria-hidden="true" /> Add voucher
        </button>
      </ManageToolbar>

      {page.data.length === 0 ? (
        <Card>
          <EmptyPanel
            title={search ? "No vouchers match." : "No vouchers yet."}
            description="Create a code customers can use for a discount at checkout."
          />
        </Card>
      ) : (
        <ManageList>
          {page.data.map((voucher) => (
            <ManageRow
              key={voucher.id}
              onOpen={() => openEditForm(voucher)}
              dimmed={!voucher.is_active}
              leading={<ManageIcon icon={<Ticket size={18} />} />}
              title={voucher.code}
              subtitle={[
                voucher.discount_type === "percentage"
                  ? `${voucher.discount_value}% off`
                  : `₱${voucher.discount_value} off`,
                voucher.min_order_amount
                  ? `Min spend ₱${voucher.min_order_amount}`
                  : null,
                voucher.applies_to.map((t) => TARGET_LABELS[t]).join(", "),
                voucher.market?.name ?? "All markets",
                voucher.is_public ? "Public" : "Exclusive",
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <RowAction
                  tone="danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete voucher ${voucher.code}?`)) {
                      deleteMutation.mutate(voucher.id);
                    }
                  }}
                >
                  Delete
                </RowAction>
              }
              pills={
                <>
                  <ManagePill tone="info">
                    {voucher.used_count}
                    {voucher.usage_limit ? `/${voucher.usage_limit}` : ""} uses
                  </ManagePill>
                  {!voucher.is_active && <ManagePill tone="muted">Inactive</ManagePill>}
                </>
              }
            />
          ))}
        </ManageList>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit voucher" : "Add voucher"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AdminStepper
            compact
            label="Voucher steps"
            steps={VOUCHER_STEPS}
            current={formStep}
            done={{ 1: discountValid, 2: formStep > 2 }}
            isLocked={(stepId) => stepId > 1 && !discountValid}
            onSelect={setFormStep}
          />

          {formStep === 1 && (
            <>
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                  Discount type
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </label>
                <Input
                  label={
                    form.discount_type === "percentage" ? "Discount (%)" : "Discount (₱)"
                  }
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 text-sm font-medium text-text">
                Applies to
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(TARGET_LABELS) as VoucherTarget[]).map((target) => (
                    <label
                      key={target}
                      className="flex items-center gap-1.5 text-sm font-normal"
                    >
                      <input
                        type="checkbox"
                        checked={form.applies_to.includes(target)}
                        onChange={() => toggleTarget(target)}
                      />
                      {TARGET_LABELS[target]}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {formStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min order amount (optional)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                />
                <Input
                  label="Max discount (optional)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.max_discount_amount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount_amount: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total usage limit (optional)"
                  type="number"
                  min="1"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                />
                <Input
                  label="Per-customer limit"
                  type="number"
                  min="1"
                  value={form.per_customer_limit}
                  onChange={(e) =>
                    setForm({ ...form, per_customer_limit: e.target.value })
                  }
                />
              </div>

              <p className="text-xs text-text-muted">Leave blank for no limit.</p>
            </>
          )}

          {formStep === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Starts at (optional)"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
                <Input
                  label="Expires at (optional)"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                  Visibility
                  <select
                    value={form.is_public ? "public" : "exclusive"}
                    onChange={(e) =>
                      setForm({ ...form, is_public: e.target.value === "public" })
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="public">
                      Public — listed for customers to browse
                    </option>
                    <option value="exclusive">
                      Exclusive — code must be entered manually
                    </option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                  Market
                  <select
                    value={form.market_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        market_id: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="">All markets</option>
                    {markets.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>

              <p className="rounded-lg bg-background p-3 text-xs text-text-muted">
                <span className="font-semibold text-text">{form.code || "CODE"}</span> —{" "}
                {form.discount_type === "percentage"
                  ? `${form.discount_value || 0}% off`
                  : `₱${form.discount_value || 0} off`}{" "}
                {form.applies_to
                  .map((target) => TARGET_LABELS[target].toLowerCase())
                  .join(", ")}
                {form.min_order_amount && `, min order ₱${form.min_order_amount}`}
                {form.max_discount_amount && `, up to ₱${form.max_discount_amount}`}
                {form.per_customer_limit && `, ${form.per_customer_limit}× per customer`}.
              </p>
            </>
          )}

          <div className="flex gap-2">
            {formStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFormStep(formStep - 1)}
              >
                ← Back
              </Button>
            )}
            <Button
              type="submit"
              fullWidth
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {formStep < VOUCHER_STEPS.length
                ? "Next →"
                : editing
                  ? "Save changes"
                  : "Create voucher"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
