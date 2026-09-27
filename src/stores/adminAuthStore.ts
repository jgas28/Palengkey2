import { create } from "zustand";
import type { AdminUser } from "@/types/adminAuth";
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from "@/services/storage/secureStorage";

const TOKEN_KEY = "palengkey_admin_token";
const USER_KEY = "palengkey_admin_user";

interface AdminAuthState {
  token: string | null;
  user: AdminUser | null;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AdminUser) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: null,
  user: null,
  hasHydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    const [token, rawUser] = await Promise.all([
      getSecureItem(TOKEN_KEY),
      getSecureItem(USER_KEY),
    ]);

    const user = rawUser ? (JSON.parse(rawUser) as AdminUser) : null;

    set({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      hasHydrated: true,
    });
  },

  setSession: async (token, user) => {
    await Promise.all([
      setSecureItem(TOKEN_KEY, token),
      setSecureItem(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user, isAuthenticated: true });
  },

  clearSession: async () => {
    await Promise.all([removeSecureItem(TOKEN_KEY), removeSecureItem(USER_KEY)]);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
