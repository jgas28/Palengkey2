import { me } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";

/** Re-fetches /me and syncs the result into authStore — used after any
 * profile/avatar mutation so the rest of the app sees the fresh data. */
export async function refreshCurrentUser(): Promise<void> {
  const { user } = await me();
  await useAuthStore.getState().setUser(user);
}
