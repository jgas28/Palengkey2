import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminRecipeType,
  deactivateAdminRecipeType,
  listAdminRecipeTypes,
  restoreAdminRecipeType,
  updateAdminRecipeType,
} from "@/services/api/adminRecipeTypes";
import { useToastStore } from "@/stores/toastStore";
import type { AdminRecipeType } from "@/types/adminRecipeType";

export default function AdminRecipeTypes() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRecipeType | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminRecipeTypes", search],
    queryFn: () => listAdminRecipeTypes({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminRecipeType(name.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypes"] });
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypesLookup"] });
      showToast("Recipe type created.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create recipe type.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminRecipeType(editing!.id, name.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypes"] });
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypesLookup"] });
      showToast("Recipe type updated.", "success");
      closeForm();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update recipe type.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (recipeTypeId: number) => deactivateAdminRecipeType(recipeTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypes"] });
      showToast("Recipe type deactivated.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate recipe type.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (recipeTypeId: number) => restoreAdminRecipeType(recipeTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipeTypes"] });
      showToast("Recipe type restored.", "success");
    },
  });

  function openCreateForm() {
    setEditing(null);
    setName("");
    setFormOpen(true);
  }

  function openEditForm(recipeType: AdminRecipeType) {
    setEditing(recipeType);
    setName(recipeType.name);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
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
      <h1 className="text-lg font-semibold">Recipe Types</h1>
      <p className="text-sm text-text-muted">
        Cooking-style tags for Paluto's filter chips (Soup, Fried, Grilled, etc.) — separate
        from the shop's grocery categories.
      </p>

      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipe types..."
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button size="sm" onClick={openCreateForm}>
          Add recipe type
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
        {data.data.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-text-muted">
            No recipe types yet.
          </li>
        )}
        {data.data.map((recipeType) => (
          <li key={recipeType.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => openEditForm(recipeType)}
              className="flex-1 text-left font-medium text-text"
            >
              {recipeType.name}
            </button>
            <span
              className={`text-xs font-semibold ${recipeType.status ? "text-status-delivered" : "text-text-muted"}`}
            >
              {recipeType.status ? "Active" : "Inactive"}
            </span>
            {recipeType.status ? (
              <Button
                variant="secondary"
                size="sm"
                loading={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate(recipeType.id)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                loading={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(recipeType.id)}
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Modal isOpen={formOpen} onClose={closeForm} title={editing ? "Edit recipe type" : "Add recipe type"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button
            type="submit"
            fullWidth
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save changes" : "Create recipe type"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
