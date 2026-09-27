import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import LoadingState from "@/components/common/LoadingState";

/** Loads the persisted customer + admin sessions once at app boot before any route renders. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const adminHasHydrated = useAdminAuthStore((state) => state.hasHydrated);
  const hydrateAdmin = useAdminAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateAdmin();
  }, [hydrate, hydrateAdmin]);

  if (!hasHydrated || !adminHasHydrated) {
    return <LoadingState label="Loading Palengkey…" />;
  }

  return children;
}
