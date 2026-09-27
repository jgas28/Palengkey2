import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import AddressForm from "@/features/addresses/AddressForm";
import { deleteAddress, listAddresses, updateAddress } from "@/services/api/addresses";
import { useToastStore } from "@/stores/toastStore";
import type { Address } from "@/types/address";

type FormState = { mode: "create" } | { mode: "edit"; address: Address } | null;

export default function AddressListView() {
  const [formState, setFormState] = useState<FormState>(null);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const {
    data: addresses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const setDefaultMutation = useMutation({
    mutationFn: (address: Address) => updateAddress(address.id, { is_default: true }),
    onSuccess: () => {
      invalidate();
      showToast("Default address updated", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (address: Address) => deleteAddress(address.id),
    onSuccess: ({ message }) => {
      invalidate();
      showToast(message, "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not delete.", "error");
    },
  });

  function handleDelete(address: Address) {
    if (window.confirm(`Remove "${address.label}"?`)) {
      deleteMutation.mutate(address);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-semibold">Addresses</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && addresses?.length === 0 && (
        <EmptyState title="No saved addresses yet." />
      )}

      {!isLoading && !isError && addresses && addresses.length > 0 && (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-2 rounded-card border border-border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text">
                    {address.label}
                    {address.is_default && (
                      <span className="ml-2 text-xs text-primary">Default</span>
                    )}
                  </p>
                  <p className="text-sm text-text-muted">{address.address}</p>
                  <p className="text-xs text-text-muted">
                    {address.contact_name} · {address.contact_phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={
                      setDefaultMutation.isPending &&
                      setDefaultMutation.variables?.id === address.id
                    }
                    onClick={() => setDefaultMutation.mutate(address)}
                  >
                    Set as default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormState({ mode: "edit", address })}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={
                    deleteMutation.isPending &&
                    deleteMutation.variables?.id === address.id
                  }
                  onClick={() => handleDelete(address)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" onClick={() => setFormState({ mode: "create" })}>
        Add new address
      </Button>

      <Drawer
        isOpen={formState !== null}
        onClose={() => setFormState(null)}
        side="bottom"
        title={formState?.mode === "edit" ? "Edit address" : "New address"}
      >
        <AddressForm
          existingAddress={formState?.mode === "edit" ? formState.address : undefined}
          onSaved={() => setFormState(null)}
        />
      </Drawer>
    </div>
  );
}
