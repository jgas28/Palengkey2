import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RegisterForm from "./RegisterForm";

vi.mock("@/services/api/auth", () => ({ register: vi.fn(), googleLogin: vi.fn() }));
vi.mock("@/features/auth/useGoogleSignIn", () => ({
  useGoogleSignIn: () => ({ signIn: vi.fn(), loading: false }),
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/privacy-policy" element={<p>Privacy page</p>} />
        <Route path="/terms-of-service" element={<p>Terms page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegisterForm policy agreements", () => {
  it("opens the privacy policy in a modal instead of leaving the form", async () => {
    renderRegister();
    const checkbox = screen.getByRole("checkbox", { name: /privacy policy/i });

    await userEvent.click(screen.getByRole("button", { name: "Privacy Policy" }));

    const dialog = screen.getByRole("dialog", { name: "Privacy Policy" });
    expect(
      within(dialog).getAllByText(/Data Privacy Act of 2012/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Privacy page")).not.toBeInTheDocument();
    // Opening it doesn't tick the box by itself.
    expect(checkbox).not.toBeChecked();

    await userEvent.click(within(dialog).getByRole("button", { name: /I understand/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("Close leaves the terms box as it was", async () => {
    renderRegister();
    const checkbox = screen.getByRole("checkbox", { name: /terms of service/i });

    await userEvent.click(screen.getByRole("button", { name: "Terms of Service" }));
    const dialog = screen.getByRole("dialog", { name: "Terms and Conditions" });
    // The footer's "Close" (the corner X is labelled Close too).
    await userEvent.click(within(dialog).getByText("Close", { selector: "button" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByText("Terms page")).not.toBeInTheDocument();
  });
});
