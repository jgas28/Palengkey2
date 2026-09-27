import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

/** Keeps already-logged-in customers out of login/register/forgot-password. */
export default function RequireGuest() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/shop" replace />;
  }

  return <Outlet />;
}
