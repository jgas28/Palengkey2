import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/auth";
import LoginForm from "./LoginForm";
import { ApiError } from "@/services/api/apiError";

vi.mock("@/services/api/auth", () => ({
  login: vi.fn(),
}));

const { login } = await import("@/services/api/auth");

const user: AuthUser = {
  id: 1,
  fname: "Juan",
  mname: null,
  lname: "Dela Cruz",
  email: "juan@example.com",
  phone: "+639171234567",
  email_verified_at: "2026-01-01T00:00:00Z",
  phone_verified_at: null,
  verification_status: "pending_admin_approval",
  id_verification_status: "not_submitted",
  requires_cod_verification: false,
  cod_verification_pending: false,
  needs_cod_details: false,
};

function renderLoginForm() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/shop" element={<p>Home page</p>} />
        <Route path="/verify-otp" element={<p>OTP page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });

  it("shows validation errors without calling the API", async () => {
    renderLoginForm();

    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows a wrong password as an alert on the form", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError("Incorrect email or password.", "invalid_credentials", {}, 401),
    );
    renderLoginForm();

    await userEvent.type(screen.getByLabelText("Email Address"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password.",
    );
  });

  it("logs in and navigates home when a token is returned", async () => {
    vi.mocked(login).mockResolvedValue({ token: "token-123", user });
    renderLoginForm();

    await userEvent.type(screen.getByLabelText("Email Address"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("routes to OTP verification when the server withholds the token", async () => {
    vi.mocked(login).mockResolvedValue({ token: null, user });
    renderLoginForm();

    await userEvent.type(screen.getByLabelText("Email Address"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByText("OTP page")).toBeInTheDocument();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
