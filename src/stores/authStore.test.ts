import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/types/auth";

vi.mock("@/services/storage/secureStorage", () => {
  const store = new Map<string, string>();
  return {
    getSecureItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setSecureItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeSecureItem: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

const { useAuthStore } = await import("./authStore");

const user: AuthUser = {
  id: 1,
  fname: "Juan",
  mname: null,
  lname: "Dela Cruz",
  email: "juan@example.com",
  phone: "+639171234567",
  email_verified_at: null,
  phone_verified_at: null,
  verification_status: "pending_admin_approval",
  id_verification_status: "not_submitted",
  requires_cod_verification: false,
  cod_verification_pending: false,
  needs_cod_details: false,
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      hasHydrated: false,
      isAuthenticated: false,
    });
  });

  it("starts unauthenticated before hydration", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().hasHydrated).toBe(false);
  });

  it("persists the session and marks authenticated on setSession", async () => {
    await useAuthStore.getState().setSession("token-123", user);

    const state = useAuthStore.getState();
    expect(state.token).toBe("token-123");
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it("restores a persisted session on hydrate", async () => {
    await useAuthStore.getState().setSession("token-123", user);
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBe("token-123");
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasHydrated).toBe(true);
  });

  it("clears the session on clearSession", async () => {
    await useAuthStore.getState().setSession("token-123", user);

    await useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
