import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Label"
        placeholder="Home, Office, etc."
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        error={errors.label}
      />
      <Input
        label="Contact name"
        value={contactName}
        onChange={(event) => setContactName(event.target.value)}
        error={errors.contactName}
      />
      <Input
        label="Contact phone"
        type="tel"
        value={contactPhone}
        onChange={(event) => setContactPhone(event.target.value)}
        error={errors.contactPhone}
      />
      <Input
        label="Address"
        placeholder="House/unit no., street, barangay, city"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        error={errors.address}
      />

      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          Pin your location
          {coords && <span className="text-xs font-normal text-primary">Location set ✓</span>}
        </span>
        <AddressMapPicker
          lat={coords?.lat ?? 0}
          lng={coords?.lng ?? 0}
          onChange={handleMapChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={locating}
          onClick={() => void handleUseLocation()}
          className="self-start"
        >
          Use my current location
        </Button>
        {errors.coords && (
          <p className="text-sm text-status-cancelled">{errors.coords}</p>
        )}
        <p className="text-xs text-text-muted">
          Tap or drag the pin to set exactly where we should deliver.
        </p>
      </div>

      <Button variant="solid" type="submit" fullWidth loading={saveMutation.isPending}>
        Save address
      </Button>
    </form>
  );
}
