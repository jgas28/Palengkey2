export interface AdminAuditLog {
  id: number;
  action: string;
  model: string | null;
  model_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  user: { id: number; name: string } | null;
}

export interface AdminAuditLogPage {
  data: AdminAuditLog[];
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}

export interface AuditLogUserOption {
  id: number;
  name: string;
}
