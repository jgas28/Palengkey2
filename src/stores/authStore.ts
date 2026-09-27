import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from "@/services/storage/secureStorage";

const TOKEN_KEY = "palengkey_auth_token";
const USER_KEY = "palengkey_auth_user";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hasHydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    const [token, rawUser] = await Promise.all([
      getSecureItem(TOKEN_KEY),
      getSecureItem(USER_KEY),
    ]);

    const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;

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

  setUser: async (user) => {
    await setSecureItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  clearSession: async () => {
    await Promise.all([removeSecureItem(TOKEN_KEY), removeSecureItem(USER_KEY)]);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
