import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChangePasswordForm from "./ChangePasswordForm";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/services/api/profile", () => ({
  changePassword: vi.fn(),
}));
vi.mock("@/services/storage/secureStorage", () => ({
  getSecureItem: vi.fn().mockResolvedValue(null),
  setSecureItem: vi.fn().mockResolvedValue(undefined),
  removeSecureItem: vi.fn().mockResolvedValue(undefined),
}));

const { changePassword } = await import("@/services/api/profile");

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/profile/password"]}>
        <Routes>
          <Route path="/profile/password" element={<ChangePasswordForm />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.mocked(changePassword).mockReset();
    useAuthStore.setState({ token: "token", isAuthenticated: true });
  });

  it("rejects a password that doesn't meet the complexity rule", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "weakpassword");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "weakpassword");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText(
        "At least 12 characters, with uppercase, lowercase, a number, and a special character.",
      ),
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("logs the user out and redirects to /login on success", async () => {
    vi.mocked(changePassword).mockResolvedValue({
      message: "Password changed. Please login again.",
    });
    renderForm();

    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "NewPassword123!");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword123!",
    );
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
