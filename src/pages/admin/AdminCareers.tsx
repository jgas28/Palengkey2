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
import { Briefcase } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import {
  createAdminCareer,
  deleteAdminCareer,
  listAdminCareers,
  updateAdminCareer,
  type CareerFormPayload,
} from "@/services/api/adminCareers";
import { useToastStore } from "@/stores/toastStore";
import type { AdminCareer, CareerJobType, CareerStatus } from "@/types/adminCareer";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageTabs,
  ManageToolbar,
  PagerBar,
  RowAction,
} from "@/components/admin/AdminManageList";

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
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCareer | null>(null);
  const [form, setForm] = useState<CareerFormPayload>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCareers", statusFilter, search, page],
    queryFn: () =>
      listAdminCareers({ status: statusFilter, search: search || undefined, page }),
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
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Growth & content"
        title="Careers"
        description="Job listings shown on the Careers page."
        actionLabel="Add job listing"
        onAction={openCreate}
      />

      <ManageToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search title or location"
      >
        <ManageTabs
          label="Job status"
          tabs={STATUS_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />
      </ManageToolbar>

      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <Card>
          <EmptyPanel
            title="No job listings."
            description="Add a listing to start recruiting."
          />
        </Card>
      )}

      {data && data.data.length > 0 && (
        <ManageList
          footer={
            <PagerBar
              page={data.current_page}
              lastPage={data.last_page}
              total={data.total}
              perPage={data.per_page}
              onPage={setPage}
            />
          }
        >
          {data.data.map((career) => (
            <ManageRow
              key={career.id}
              onOpen={() => openEdit(career)}
              dimmed={career.status !== "open"}
              leading={<ManageIcon icon={<Briefcase size={18} />} />}
              title={career.title}
              subtitle={[
                career.location,
                career.job_type.replace("-", " "),
                career.salary_range,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <RowAction
                  tone="danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete "${career.title}"?`)) {
                      deleteMutation.mutate(career.id);
                    }
                  }}
                >
                  Delete
                </RowAction>
              }
              pills={
                <ManagePill
                  tone={
                    career.status === "open"
                      ? "active"
                      : career.status === "filled"
                        ? "info"
                        : "muted"
                  }
                >
                  {career.status.charAt(0).toUpperCase() + career.status.slice(1)}
                </ManagePill>
              }
            />
          ))}
        </ManageList>
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
