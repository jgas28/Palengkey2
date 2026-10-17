import { useState, type FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePager,
  ManagePill,
  ManageRow,
  ManageToolbar,
  RowAction,
  manageSelect,
} from "@/components/admin/AdminManageList";
import {
  createAdminCategory,
  deactivateAdminCategory,
  listAdminCategoriesPage,
  restoreAdminCategory,
  updateAdminCategory,
} from "@/services/api/adminCategories";
import { useToastStore } from "@/stores/toastStore";
import type { AdminCategory } from "@/types/adminCategory";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "0" | "1">("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [bulkMinKg, setBulkMinKg] = useState("");
  const [bulkDiscountPerKg, setBulkDiscountPerKg] = useState("");
  // Not every category sells in bulk — off sends a blank minimum, which disables it.
  const [bulkEnabled, setBulkEnabled] = useState(false);
  const bulkMinKgToSave = bulkEnabled ? bulkMinKg : "";
  const bulkDiscountToSave = bulkEnabled ? bulkDiscountPerKg : "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCategories", search, statusFilter, page],
    queryFn: () =>
      listAdminCategoriesPage({
        search,
        status: statusFilter || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminCategory(name, image ?? undefined, bulkMinKgToSave, bulkDiscountToSave),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      showToast("Category created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create category.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminCategory(
        editing!.id,
        name,
        image ?? undefined,
        bulkMinKgToSave,
        bulkDiscountToSave,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      showToast("Category updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update category.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (categoryId: number) => deactivateAdminCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      showToast("Category deactivated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate category.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (categoryId: number) => restoreAdminCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      showToast("Category restored.", "success");
    },
  });

  function openCreateForm() {
    setEditing(null);
    setName("");
    setImage(null);
    setBulkMinKg("");
    setBulkDiscountPerKg("");
    setBulkEnabled(false);
    setFormOpen(true);
  }

  function openEditForm(category: AdminCategory) {
    setEditing(category);
    setName(category.name);
    setImage(null);
    setBulkMinKg(category.bulk_min_kg ? String(Number(category.bulk_min_kg)) : "");
    setBulkEnabled(Boolean(category.bulk_min_kg));
    setBulkDiscountPerKg(
      category.bulk_discount_per_kg !== null &&
        category.bulk_discount_per_kg !== undefined
        ? String(Number(category.bulk_discount_per_kg))
        : "",
    );
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setImage(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const categories = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        title="Categories"
        description="Manage Palengkey categories from one place."
        onAction={openCreateForm}
      />

      <ManageToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search categories"
      >
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | "0" | "1");
            setPage(1);
          }}
          className={manageSelect}
        >
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Deactivated</option>
        </select>
      </ManageToolbar>

      {isLoading && (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && categories.length === 0 && (
        <Card>
          <EmptyPanel
            title={search || statusFilter ? "No categories match." : "No categories yet."}
            description="Categories group items in the shop, like Gulay, Isda and Karne."
          />
        </Card>
      )}

      {data && categories.length > 0 && (
        <ManageList
          footer={
            data.last_page > 1 ? (
              <ManagePager
                page={data.current_page}
                lastPage={data.last_page}
                onPage={setPage}
              />
            ) : undefined
          }
        >
          {categories.map((category) => (
            <ManageRow
              key={category.id}
              onOpen={() => openEditForm(category)}
              dimmed={!category.status}
              leading={
                <ManageIcon icon={<ShieldCheck size={18} />} image={category.image_url} />
              }
              title={category.name}
              subtitle={`${category.active_items_count} active item${
                category.active_items_count === 1 ? "" : "s"
              }`}
              actions={
                category.status ? (
                  <RowAction
                    tone="danger"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(category.id)}
                  >
                    Deactivate
                  </RowAction>
                ) : (
                  <RowAction
                    tone="success"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(category.id)}
                  >
                    Restore
                  </RowAction>
                )
              }
              pills={
                <>
                  {category.bulk_min_kg && (
                    <ManagePill tone="warning">
                      Bulk {Number(category.bulk_min_kg)} kg+
                      {category.bulk_discount_per_kg !== null &&
                      category.bulk_discount_per_kg !== undefined
                        ? ` · ₱${Number(category.bulk_discount_per_kg)}/kg off`
                        : ""}
                    </ManagePill>
                  )}
                  <ManagePill tone={category.status ? "active" : "muted"}>
                    {category.status ? "Active" : "Deactivated"}
                  </ManagePill>
                </>
              }
            />
          ))}
        </ManageList>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit category" : "Add category"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={bulkEnabled}
                onChange={(e) => setBulkEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block font-medium text-text">Offer bulk pricing</span>
                <span className="text-xs text-text-muted">
                  Only for categories sold by weight (e.g. meat, seafood, vegetables). Off
                  = no bulk price or delivery subsidy for anything in this category.
                </span>
              </span>
            </label>

            {bulkEnabled && (
              <>
                <Input
                  label="Bulk order minimum (kg)"
                  type="number"
                  min="0.001"
                  step="0.25"
                  value={bulkMinKg}
                  onChange={(e) => setBulkMinKg(e.target.value)}
                  placeholder="e.g. 6 for meat, 10 for vegetables"
                  helperText="One item at this weight or more gets the bulk price + delivery subsidy. Items can override this."
                  required
                />

                <Input
                  label="Bulk discount (₱ off per kg)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={bulkDiscountPerKg}
                  onChange={(e) => setBulkDiscountPerKg(e.target.value)}
                  placeholder="e.g. 5 — meat ₱5 less per kilo"
                  helperText="Taken off the per-kg selling price once the minimum is reached. Leave blank to use the default in Settings → Bulk Orders. Items can override this."
                />
              </>
            )}
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            {editing ? "Replace image (optional)" : "Image (optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-sm text-text-muted"
            />
          </label>
          {editing && (
            <img
              src={editing.image_url}
              alt={editing.name}
              className="h-24 w-24 rounded-card object-cover"
            />
          )}

          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save changes" : "Create category"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
