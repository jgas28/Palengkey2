import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import PkSheet from "@/components/pk/PkSheet";
import AddressForm from "@/features/addresses/AddressForm";
import { deleteAddress, listAddresses, updateAddress } from "@/services/api/addresses";
import { useToastStore } from "@/stores/toastStore";
import type { Address } from "@/types/address";

type FormState = { mode: "create" } | { mode: "edit"; address: Address } | null;

/** The design's saved-addresses page — address cards + "Add an address" sheet. */
export default function AddressListView() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(null);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const setDefaultMutation = useMutation({
    mutationFn: (address: Address) => updateAddress(address.id, { is_default: true }),
    onSuccess: () => {
      void invalidate();
      showToast("Default address updated", "success");
    },
    onError: (error) => showToast(error instanceof Error ? error.message : "Could not update.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (address: Address) => deleteAddress(address.id),
    onSuccess: ({ message }) => {
      void invalidate();
      showToast(message, "success");
    },
    onError: (error) => showToast(error instanceof Error ? error.message : "Could not delete.", "error"),
  });

  function handleDelete(address: Address) {
    if (window.confirm(`Remove "${address.label}"?`)) deleteMutation.mutate(address);
  }

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title page-title-action">
        <div>
          <p className="kicker">Delivery locations</p>
          <h1>Saved addresses</h1>
          <p>Choose where your market goods should be delivered.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setFormState({ mode: "create" })}>
          <Icon name="plus" /> Add address
        </button>
      </div>

      <section className="shell address-grid">
        {isLoading && (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            <Icon name="truck" size={34} />
            <h3>Loading addresses…</h3>
          </div>
        )}
        {isError && (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            <Icon name="x" size={34} />
            <h3>Something went wrong</h3>
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && addresses.length === 0 && (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            <Icon name="truck" size={34} />
            <h3>No saved addresses yet</h3>
            <p>Add where we should bring your market goods.</p>
            <button type="button" className="btn primary" onClick={() => setFormState({ mode: "create" })}>
              Add address
            </button>
          </div>
        )}
        {addresses.map((address) => (
          <article key={address.id}>
            <div className="address-map">
              <span className="road road-one"></span>
              <span className="road road-two"></span>
              <i>
                <Icon name="truck" />
              </i>
            </div>
            <div className="address-card-body">
              <div>
                <span>
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <h2>{address.label}</h2>
                  {address.is_default && <small>Default</small>}
                </div>
              </div>
              <p>{address.address}</p>
              <small>
                {address.contact_name} · {address.contact_phone}
              </small>
              <div className="address-actions">
                <button type="button" onClick={() => setFormState({ mode: "edit", address })}>
                  Edit
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    style={{ color: "var(--teal-dark)" }}
                    disabled={setDefaultMutation.isPending}
                    onClick={() => setDefaultMutation.mutate(address)}
                  >
                    Set as default
                  </button>
                )}
                <button type="button" disabled={deleteMutation.isPending} onClick={() => handleDelete(address)}>
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <button type="button" className="back-profile" onClick={() => navigate("/profile")}>
        <Icon name="arrow" /> Back to profile
      </button>

      <PkSheet
        isOpen={formState !== null}
        onClose={() => setFormState(null)}
        kicker={formState?.mode === "edit" ? "Delivery location" : "New delivery location"}
        title={formState?.mode === "edit" ? "Edit address" : "Add an address"}
      >
        <AddressForm
          existingAddress={formState?.mode === "edit" ? formState.address : undefined}
          onSaved={() => setFormState(null)}
        />
      </PkSheet>
    </main>
  );
}
