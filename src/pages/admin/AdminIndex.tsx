import { Navigate } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

/** Sends the admin to the first area their role can actually access. */
export default function AdminIndex() {
  const role = useAdminAuthStore((state) => state.user?.role);

  if (role === "marketing") return <Navigate to="/admin/marketing" replace />;
  if (role === "finance") return <Navigate to="/admin/finance" replace />;

  return <Navigate to="/admin/dashboard" replace />;
}
