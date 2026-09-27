export type AdminRole = "admin" | "marketing" | "finance" | "owner" | "super_admin";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  market_id: number | null;
  market_name: string | null;
}
