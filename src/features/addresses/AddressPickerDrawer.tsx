import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import AddressForm from "@/features/addresses/AddressForm";
import { listAddresses } from "@/services/api/addresses";
import type { Address } from "@/types/address";

export interface AddressPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddressId: number | null;
  onSelect: (address: Address) => void;
}

export default function AddressPickerDrawer({
  isOpen,
  onClose,
  selectedAddressId,
  onSelect,
}: AddressPickerDrawerProps) {
  const [showForm, setShowForm] = useState(false);

  const {
    data: addresses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
    enabled: isOpen,
  });

  function handleSelect(address: Address) {
    onSelect(address);
    onClose();
  }

  function handleSaved(address: Address) {
    setShowForm(false);
    handleSelect(address);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => {
        setShowForm(false);
        onClose();
      }}
      side="bottom"
      title={showForm ? "New address" : "Delivery address"}
    >
      {showForm ? (
        <AddressForm onSaved={handleSaved} />
      ) : (
        <div className="flex flex-col gap-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {isError && <ErrorState onRetry={() => void refetch()} />}

          {!isLoading && !isError && addresses?.length === 0 && (
            <EmptyState
              icon={<span className="text-5xl">📍</span>}
              title="No saved addresses yet."
            />
          )}

          {!isLoading && !isError && addresses && addresses.length > 0 && (
            <ul className="flex flex-col gap-2">
              {addresses.map((address) => {
                const isSelected = address.id === selectedAddressId;
                return (
                  <li key={address.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(address)}
                      className={`flex w-full items-start justify-between gap-3 rounded-card border p-3.5 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary-50"
                          : "border-border bg-surface md:hover:border-primary-200"
                      }`}
                    >
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-text">
                          {address.label}
                          {address.is_default && (
                            <span className="ml-2 rounded-pill bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-text-muted">{address.address}</span>
                        <span className="text-xs text-text-muted">
                          {address.contact_name} · {address.contact_phone}
                        </span>
                      </span>
                      {isSelected && (
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Button variant="secondary" onClick={() => setShowForm(true)}>
            Add new address
          </Button>
        </div>
      )}
    </Drawer>
  );
}
