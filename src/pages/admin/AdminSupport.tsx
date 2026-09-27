import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { listAdminSupportThreads } from "@/services/api/adminSupport";
import type { SupportThreadStatus } from "@/types/adminSupport";

const STATUSES: { value: SupportThreadStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

export default function AdminSupport() {
  const [status, setStatus] = useState<SupportThreadStatus | "all">("open");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminSupportThreads", status],
    queryFn: () => listAdminSupportThreads(status),
    refetchInterval: 15000,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Support</h1>

      <div className="flex gap-1 border-b border-border">
        {STATUSES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              status === item.value
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState title="No conversations." description="Nothing here right now." />
      )}

      {data && data.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {data.data.map((thread) => (
            <li key={thread.id}>
              <Link
                to={`/admin/support/${thread.id}`}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium text-text">{thread.subject}</span>
                  {thread.unread_customer_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-accent px-1.5 text-xs font-semibold text-white">
                      {thread.unread_customer_count}
                    </span>
                  )}
                </div>
                {thread.latest_message && (
                  <p className="line-clamp-1 text-sm text-text-muted">
                    {thread.latest_message.sender_type === "admin" ? "You: " : ""}
                    {thread.latest_message.body}
                  </p>
                )}
                <span className="text-xs text-text-muted">
                  {thread.customer?.fname} {thread.customer?.lname}
                  {thread.market && ` · ${thread.market.name}`}
                  {thread.order && ` · Order #${thread.order.order_number}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
