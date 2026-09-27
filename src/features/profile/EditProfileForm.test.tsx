import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditProfileForm from "./EditProfileForm";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/auth";

vi.mock("@/services/api/profile", () => ({
  updateProfile: vi.fn(),
}));
vi.mock("@/features/profile/refreshCurrentUser", () => ({
  refreshCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

const { updateProfile } = await import("@/services/api/profile");

const user: AuthUser = {
  id: 1,
  fname: "Juan",
  mname: null,
  lname: "Dela Cruz",
  email: "juan@example.com",
  phone: "+639171234567",
  email_verified_at: "2026-01-01T00:00:00Z",
  phone_verified_at: null,
  verification_status: "approved",
  id_verification_status: "not_submitted",
  requires_cod_verification: false,
  cod_verification_pending: false,
  needs_cod_details: false,
};

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EditProfileForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EditProfileForm", () => {
  beforeEach(() => {
    vi.mocked(updateProfile).mockReset();
    useAuthStore.setState({ user, token: "token", isAuthenticated: true });
  });

  it("pre-fills fields from the current user", () => {
    renderForm();
    expect(screen.getByLabelText("First name")).toHaveValue("Juan");
    expect(screen.getByLabelText("Last name")).toHaveValue("Dela Cruz");
  });

  it("shows a validation error for an invalid phone", async () => {
    renderForm();

    const phoneInput = screen.getByLabelText("Phone");
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, "12345");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Use +63 followed by 10 digits, e.g. +639171234567."),
    ).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("submits trimmed values", async () => {
    vi.mocked(updateProfile).mockResolvedValue({
      message: "Profile updated successfully",
    });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProfile).toHaveBeenCalledWith({
      fname: "Juan",
      mname: undefined,
      lname: "Dela Cruz",
      phone: "+639171234567",
    });
  });
});
