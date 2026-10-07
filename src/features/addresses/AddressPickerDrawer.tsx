import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import PkSheet from "@/components/pk/PkSheet";
import AddressForm from "@/features/addresses/AddressForm";
import { listAddresses } from "@/services/api/addresses";
import type { Address } from "@/types/address";

export interface AddressPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddressId: number | null;
  onSelect: (address: Address) => void;
}

/** Checkout's "where should we deliver?" picker, on the design's address sheet. */
export default function AddressPickerDrawer({
  isOpen,
  onClose,
  selectedAddressId,
  onSelect,
}: AddressPickerDrawerProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: addresses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
    enabled: isOpen,
  });

  function handleSelect(address: Address) {
    onSelect(address);
    onClose();
  }

  function close() {
    setShowForm(false);
    onClose();
  }

  return (
    <PkSheet
      isOpen={isOpen}
      onClose={close}
      kicker={showForm ? "New delivery location" : "Delivery address"}
      title={showForm ? "Add an address" : "Where should we deliver?"}
    >
      {showForm ? (
        <AddressForm
          onSaved={(address) => {
            setShowForm(false);
            handleSelect(address);
          }}
        />
      ) : (
        <>
          <div className="market-options">
            {isLoading && <p style={{ color: "var(--muted)", fontSize: 11 }}>Loading addresses…</p>}
            {isError && (
              <button type="button" onClick={() => void refetch()}>
                <span>
                  <Icon name="x" />
                </span>
                <div>
                  <strong>Couldn&apos;t load addresses</strong>
                  <p>Tap to try again.</p>
                </div>
              </button>
            )}
            {!isLoading && !isError && addresses.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 11 }}>No saved addresses yet.</p>
            )}
            {addresses.map((address) => {
              const selected = address.id === selectedAddressId;
              return (
                <button
                  type="button"
                  className={selected ? "selected" : ""}
                  key={address.id}
                  onClick={() => handleSelect(address)}
                >
                  <span>
                    <Icon name="truck" />
                  </span>
                  <div>
                    <strong>
                      {address.label}
                      {address.is_default ? " · Default" : ""}
                    </strong>
                    <p>{address.address}</p>
                    <small>
                      {address.contact_name} · {address.contact_phone}
                    </small>
                  </div>
                  <i>{selected ? <Icon name="check" size={16} /> : <Icon name="chevron" size={16} />}</i>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn outline"
            style={{ width: "100%", marginTop: 16 }}
            onClick={() => setShowForm(true)}
          >
            <Icon name="plus" /> Add new address
          </button>
        </>
      )}
    </PkSheet>
  );
}
