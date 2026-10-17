import type { AdminRole } from "@/types/adminAuth";

export interface AdminManagedUser {
  id: number;
  fname: string;
  lname: string;
  mname: string | null;
  name: string;
  email: string;
  role: AdminRole;
  market_id: number | null;
  market_name: string | null;
  /** Latest sign-in activity; null = never signed in. */
  last_active_at?: string | null;
}
