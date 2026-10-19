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
import { Soup } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import {
  createAdminRecipeType,
  deactivateAdminRecipeType,
  listAdminRecipeTypes,
  restoreAdminRecipeType,
  updateAdminRecipeType,
} from "@/services/api/adminRecipeTypes";
import { useToastStore } from "@/stores/toastStore";
import type { AdminRecipeType } from "@/types/adminRecipeType";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageToolbar,
  PagerBar,
  RowAction,
} from "@/components/admin/AdminManageList";

export default function AdminRecipeTypes() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRecipeType | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminRecipeTypes", search, page],
    queryFn: () => listAdminRecipeTypes({ search: search || undefined, page }),
    placeholderData: keepPreviousData,
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

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Paluto & recipes"
        title="Recipe types"
        description="Cooking-style tags for Paluto's filter chips (Soup, Fried, Grilled) — separate from grocery categories."
        actionLabel="Add recipe type"
        onAction={openCreateForm}
      />

      <ManageToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search recipe types"
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
            title={search ? "No recipe types match." : "No recipe types yet."}
            description="Add tags like Soup, Fried or Grilled for Paluto's filters."
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
          {data.data.map((recipeType) => (
            <ManageRow
              key={recipeType.id}
              onOpen={() => openEditForm(recipeType)}
              dimmed={!recipeType.status}
              leading={<ManageIcon icon={<Soup size={18} />} />}
              title={recipeType.name}
              subtitle="Paluto filter tag"
              actions={
                recipeType.status ? (
                  <RowAction
                    tone="danger"
                    disabled={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate(recipeType.id)}
                  >
                    Deactivate
                  </RowAction>
                ) : (
                  <RowAction
                    tone="success"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(recipeType.id)}
                  >
                    Restore
                  </RowAction>
                )
              }
              pills={
                <ManagePill tone={recipeType.status ? "active" : "muted"}>
                  {recipeType.status ? "Active" : "Inactive"}
                </ManagePill>
              }
            />
          ))}
        </ManageList>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? "Edit recipe type" : "Add recipe type"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
