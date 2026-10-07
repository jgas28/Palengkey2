import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import PkField from "@/components/pk/PkField";
import AddressMapPicker from "@/features/addresses/AddressMapPicker";
import { createAddress, updateAddress } from "@/services/api/addresses";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { useToastStore } from "@/stores/toastStore";
import type { Address } from "@/types/address";

export interface AddressFormProps {
  existingAddress?: Address;
  onSaved: (address: Address) => void;
}

export default function AddressForm({ existingAddress, onSaved }: AddressFormProps) {
  const [label, setLabel] = useState(existingAddress?.label ?? "Home");
  const [contactName, setContactName] = useState(existingAddress?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(existingAddress?.contact_phone ?? "");
  const [address, setAddress] = useState(existingAddress?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    existingAddress
      ? { lat: existingAddress.latitude, lng: existingAddress.longitude }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload: {
      label: string;
      contact_name: string;
      contact_phone: string;
      address: string;
      latitude: number;
      longitude: number;
    }) =>
      existingAddress
        ? updateAddress(existingAddress.id, payload)
        : createAddress(payload),
    onSuccess: ({ address: saved, message }) => {
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
      showToast(message, "success");
      onSaved(saved);
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save address.",
        "error",
      );
    },
  });

  async function handleUseLocation() {
    setLocating(true);
    const result = await getCurrentCoordinates();
    setLocating(false);
    if (!result) {
      showToast("Couldn't get your location. Please allow location access.", "error");
      return;
    }
    setCoords(result);
  }

  function handleMapChange(nextCoords: { lat: number; lng: number }, formattedAddress?: string) {
    setCoords(nextCoords);
    if (formattedAddress && !address.trim()) {
      setAddress(formattedAddress);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!label.trim()) nextErrors.label = "Label is required.";
    if (!contactName.trim()) nextErrors.contactName = "Contact name is required.";
    if (!contactPhone.trim()) nextErrors.contactPhone = "Contact phone is required.";
    if (!address.trim()) nextErrors.address = "Address is required.";
    if (!coords) nextErrors.coords = "Set your location so we can calculate delivery.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveMutation.mutate({
      label: label.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      address: address.trim(),
      latitude: coords!.lat,
      longitude: coords!.lng,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="address-form">
        <PkField
          label="Address label"
          placeholder="Home, Office, or another label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={errors.label}
        />
        <PkField
          label="Address"
          placeholder="House/unit, street, barangay, city"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          error={errors.address}
        />
        <div>
          <PkField
            label="Contact name"
            placeholder="Full name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            error={errors.contactName}
          />
          <PkField
            label="Contact phone"
            type="tel"
            placeholder="09XX XXX XXXX"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            error={errors.contactPhone}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#465456", fontSize: 9, fontWeight: 700 }}>
          Pin your exact location
          {coords && <span style={{ color: "var(--teal)" }}>Location set ✓</span>}
        </span>
        <div style={{ overflow: "hidden", borderRadius: 14 }}>
          <AddressMapPicker lat={coords?.lat ?? 0} lng={coords?.lng ?? 0} onChange={handleMapChange} />
        </div>
        <button
          type="button"
          className="btn outline"
          style={{ justifySelf: "start", height: 36, fontSize: 10 }}
          disabled={locating}
          onClick={() => void handleUseLocation()}
        >
          <Icon name="truck" size={15} /> {locating ? "Locating…" : "Use my current location"}
        </button>
        {errors.coords && <small style={{ color: "#dc2626", fontSize: 10 }}>{errors.coords}</small>}
        <small style={{ color: "var(--muted)", fontSize: 9 }}>
          Tap or drag the pin to set exactly where we should deliver.
        </small>
      </div>

      <button type="submit" className="btn primary" style={{ width: "100%" }} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving…" : "Save address"} <Icon name="check" />
      </button>
    </form>
  );
}
