import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

export default function RequireAdminAuth() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
