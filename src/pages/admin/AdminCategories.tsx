import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCategories", search, statusFilter, page],
    queryFn: () =>
      listAdminCategoriesPage({
        search,
        status: statusFilter || undefined,
        page,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminCategory(name, image ?? undefined),
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
    mutationFn: () => updateAdminCategory(editing!.id, name, image ?? undefined),
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
    setFormOpen(true);
  }

  function openEditForm(category: AdminCategory) {
    setEditing(category);
    setName(category.name);
    setImage(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Categories</h1>
        <Button size="sm" onClick={openCreateForm}>
          Add category
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search categories…"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | "0" | "1");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Deactivated</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {data.data.map((category) => (
          <div
            key={category.id}
            className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
          >
            <img
              src={category.image_url}
              alt={category.name}
              className="aspect-square w-full object-cover"
            />
            <div className="flex flex-col gap-2 p-3">
              <span className="text-sm font-medium text-text">{category.name}</span>
              <span className="text-xs text-text-muted">
                {category.active_items_count} active item
                {category.active_items_count === 1 ? "" : "s"}
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openEditForm(category)}
                  className="text-primary"
                >
                  Edit
                </button>
                {category.status ? (
                  <button
                    type="button"
                    onClick={() => deactivateMutation.mutate(category.id)}
                    className="text-status-cancelled"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => restoreMutation.mutate(category.id)}
                    className="text-status-delivered"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-text-muted">
          Page {data.current_page} of {data.last_page}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={data.current_page >= data.last_page}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

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
