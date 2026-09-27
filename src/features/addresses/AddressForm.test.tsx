import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import AddressForm from "./AddressForm";
import type { Address } from "@/types/address";

vi.mock("@/services/api/addresses", () => ({
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
}));
vi.mock("@/utils/geolocation", () => ({
  getCurrentCoordinates: vi.fn(),
}));

const { createAddress, updateAddress } = await import("@/services/api/addresses");
const { getCurrentCoordinates } = await import("@/utils/geolocation");

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const address: Address = {
  id: 1,
  customer_id: 1,
  label: "Home",
  contact_name: "Juan",
  contact_phone: "09171234567",
  address: "123 Rizal St.",
  latitude: 14.6,
  longitude: 121.0,
  is_default: false,
  created_at: "",
  updated_at: "",
};

describe("AddressForm", () => {
  beforeEach(() => {
    vi.mocked(createAddress).mockReset();
    vi.mocked(updateAddress).mockReset();
    vi.mocked(getCurrentCoordinates).mockReset();
  });

  it("shows validation errors without calling createAddress", async () => {
    renderWithClient(<AddressForm onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByText("Contact name is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Set your location so we can calculate delivery."),
    ).toBeInTheDocument();
    expect(createAddress).not.toHaveBeenCalled();
  });

  it("submits with coordinates from geolocation and calls onSaved", async () => {
    vi.mocked(getCurrentCoordinates).mockResolvedValue({ lat: 14.6, lng: 121.0 });
    vi.mocked(createAddress).mockResolvedValue({ message: "Address created", address });

    const onSaved = vi.fn();
    renderWithClient(<AddressForm onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText("Contact name"), "Juan");
    await userEvent.type(screen.getByLabelText("Contact phone"), "09171234567");
    await userEvent.type(screen.getByLabelText("Address"), "123 Rizal St.");
    await userEvent.click(
      screen.getByRole("button", { name: "Use my current location" }),
    );
    await screen.findByText("Location set ✓");
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));

    expect(createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_name: "Juan",
        latitude: 14.6,
        longitude: 121.0,
      }),
    );
    await vi.waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(address);
    });
  });

  it("pre-fills fields and calls updateAddress when editing an existing address", async () => {
    vi.mocked(updateAddress).mockResolvedValue({ message: "Address updated", address });

    const onSaved = vi.fn();
    renderWithClient(<AddressForm existingAddress={address} onSaved={onSaved} />);

    expect(screen.getByDisplayValue("123 Rizal St.")).toBeInTheDocument();
    expect(screen.getByText("Location set ✓")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save address" }));

    expect(updateAddress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ contact_name: "Juan" }),
    );
    await vi.waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(address);
    });
  });
});
