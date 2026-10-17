import { useState } from "react";
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
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminCareer,
  deleteAdminCareer,
  listAdminCareers,
  updateAdminCareer,
  type CareerFormPayload,
} from "@/services/api/adminCareers";
import { useToastStore } from "@/stores/toastStore";
import type { AdminCareer, CareerJobType, CareerStatus } from "@/types/adminCareer";
import { ManageHeader, ManageTabs } from "@/components/admin/AdminManageList";

const STATUS_FILTERS: { value: CareerStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const EMPTY_FORM: CareerFormPayload = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: "",
  job_type: "full-time",
  salary_range: "",
  status: "open",
  expires_at: "",
  is_active: true,
};

export default function AdminCareers() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [statusFilter, setStatusFilter] = useState<CareerStatus | "all">("open");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCareer | null>(null);
  const [form, setForm] = useState<CareerFormPayload>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCareers", statusFilter, search],
    queryFn: () =>
      listAdminCareers({ status: statusFilter, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(career: AdminCareer) {
    setEditing(career);
    setForm({
      title: career.title,
      description: career.description,
      responsibilities: career.responsibilities,
      requirements: career.requirements,
      location: career.location,
      job_type: career.job_type,
      salary_range: career.salary_range ?? "",
      status: career.status,
      expires_at: career.expires_at ? career.expires_at.slice(0, 10) : "",
      is_active: career.is_active,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const createMutation = useMutation({
    mutationFn: () => createAdminCareer(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCareers"] });
      showToast("Job listing created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create listing.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminCareer(editing!.id, form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCareers"] });
      showToast("Job listing updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update listing.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (careerId: number) => deleteAdminCareer(careerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCareers"] });
      showToast("Job listing deleted.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not delete listing.",
        "error",
      );
    },
  });

  const isFormValid =
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.responsibilities.trim().length > 0 &&
    form.requirements.trim().length > 0 &&
    form.location.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <ManageHeader
        eyebrow="Growth & content"
        title="Careers"
        description="Job listings shown on the Careers page."
        actionLabel="Add job listing"
        onAction={openCreate}
      />

      <ManageTabs
        label="Job status"
        tabs={STATUS_FILTERS.map((item) => ({
          value: item.value,
          label: item.label,
          count: null,
        }))}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search title or location..."
        className="rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 py-2"
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState
          title="No job listings."
          description="Add a listing to start recruiting."
        />
      )}

      {data && data.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {data.data.map((career) => (
            <li
              key={career.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => openEdit(career)}
                className="flex flex-1 flex-col items-start gap-0.5 text-left"
              >
                <span className="font-medium text-text">{career.title}</span>
                <span className="text-xs text-text-muted">
                  {career.location} · {career.job_type}
                  {career.salary_range && ` · ${career.salary_range}`}
                </span>
              </button>
              <span
                className={`text-xs font-semibold capitalize ${
                  career.status === "open" ? "text-status-delivered" : "text-text-muted"
                }`}
              >
                {career.status}
              </span>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(career.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit job listing" : "Add job listing"}
      >
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            required
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Responsibilities
            <textarea
              value={form.responsibilities}
              onChange={(e) =>
                setForm((f) => ({ ...f, responsibilities: e.target.value }))
              }
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Requirements
            <textarea
              value={form.requirements}
              onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              rows={3}
              className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Job type
              <select
                value={form.job_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, job_type: e.target.value as CareerJobType }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as CareerStatus }))
                }
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
          <Input
            label="Salary range (optional)"
            value={form.salary_range}
            onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
          />
          <Input
            label="Expires on (optional)"
            type="date"
            value={form.expires_at}
            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-text">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Visible to applicants
          </label>

          <Button
            loading={editing ? updateMutation.isPending : createMutation.isPending}
            disabled={!isFormValid}
            onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
          >
            {editing ? "Save changes" : "Create listing"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
