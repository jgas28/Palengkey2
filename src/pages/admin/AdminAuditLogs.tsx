import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listAdminAuditLogs, listAuditLogUsers } from "@/services/api/adminAuditLog";
import type { AdminAuditLog } from "@/types/adminAuditLog";
import { ManageHeader } from "@/components/admin/AdminManageList";

/** "Oct 7, 2026, 7:21 PM" in Manila time. */
function manilaTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["auditLogUsers"],
    queryFn: listAuditLogUsers,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminAuditLogs", search, action, userId, page],
    queryFn: () =>
      listAdminAuditLogs({
        search,
        action,
        userId: userId ? Number(userId) : undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-4">
      <ManageHeader
        eyebrow="Administration"
        title="Audit logs"
        description="Every change made in the CMS, newest first."
      />

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search action, model, or id…"
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <input
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          placeholder="Action (e.g. created)"
          className="h-10 w-48 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value ? Number(e.target.value) : "");
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState
          title="No audit log entries."
          description="Nothing matches these filters."
        />
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    className="cursor-pointer hover:bg-background"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                      {manilaTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{log.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-text">{log.action}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {log.model}
                      {log.model_id && ` #${log.model_id}`}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{log.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              Page {data.current_page} of {data.last_page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.current_page >= data.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Audit log entry"
      >
        {selected && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium text-text">
                {selected.user?.name ?? "System"}
              </span>{" "}
              <span className="text-text-muted">{selected.action}</span>{" "}
              {selected.model && (
                <span className="text-text-muted">
                  {selected.model}
                  {selected.model_id && ` #${selected.model_id}`}
                </span>
              )}
            </p>
            <p className="text-xs text-text-muted">
              {manilaTime(selected.created_at)} · {selected.ip ?? "no IP recorded"}
            </p>
            {selected.old_values && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-text-muted">
                  Before
                </p>
                <pre className="overflow-x-auto rounded-lg bg-background p-3 text-xs">
                  {JSON.stringify(selected.old_values, null, 2)}
                </pre>
              </div>
            )}
            {selected.new_values && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-text-muted">
                  After
                </p>
                <pre className="overflow-x-auto rounded-lg bg-background p-3 text-xs">
                  {JSON.stringify(selected.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
