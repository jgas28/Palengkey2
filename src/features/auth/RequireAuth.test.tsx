import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import RequireAuth from "./RequireAuth";
import RequireGuest from "./RequireGuest";

function renderWithAuthGuard() {
  return render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/cart" element={<p>Cart contents</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderWithGuestGuard() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<p>Login page</p>} />
        </Route>
        <Route path="/shop" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false });
  });

  it("redirects to /login when not authenticated", () => {
    renderWithAuthGuard();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the protected route when authenticated", () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderWithAuthGuard();
    expect(screen.getByText("Cart contents")).toBeInTheDocument();
  });
});

describe("RequireGuest", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false });
  });

  it("renders the guest route when not authenticated", () => {
    renderWithGuestGuard();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects to /shop when already authenticated", () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderWithGuestGuard();
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });
});
