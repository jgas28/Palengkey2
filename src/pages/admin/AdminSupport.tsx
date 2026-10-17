import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import { listAdminSupportThreads } from "@/services/api/adminSupport";
import type { SupportThreadStatus } from "@/types/adminSupport";
import {
  ManageHeader,
  ManageIcon,
  ManageList,
  ManagePill,
  ManageRow,
  ManageTabs,
} from "@/components/admin/AdminManageList";

const STATUSES: { value: SupportThreadStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} d ago`;
}

export default function AdminSupport() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SupportThreadStatus | "all">("open");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminSupportThreads", status],
    queryFn: () => listAdminSupportThreads(status),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  });

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Customers"
        title="Support"
        description="Customer conversations and help requests."
      />

      <ManageTabs
        label="Ticket status"
        tabs={STATUSES.map((item) => ({
          value: item.value,
          label: item.label,
          count: null,
        }))}
        value={status}
        onChange={setStatus}
      />

      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.data.length === 0 && (
        <Card>
          <EmptyPanel title="No conversations." description="Nothing here right now." />
        </Card>
      )}

      {data && data.data.length > 0 && (
        <ManageList>
          {data.data.map((thread) => {
            const customer = [thread.customer?.fname, thread.customer?.lname]
              .filter(Boolean)
              .join(" ");
            return (
              <ManageRow
                key={thread.id}
                onOpen={() => navigate(`/admin/support/${thread.id}`)}
                leading={<ManageIcon icon={<MessageCircle size={18} />} />}
                title={`SUP-${String(thread.id).padStart(4, "0")} · ${thread.subject}`}
                subtitle={
                  <>
                    {[
                      customer || "Customer",
                      thread.order && `Order #${thread.order.order_number}`,
                      timeAgo(thread.last_message_at),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {thread.latest_message && (
                      <span className="block truncate text-slate-400">
                        {thread.latest_message.sender_type === "admin" ? "You: " : ""}
                        {thread.latest_message.body}
                      </span>
                    )}
                  </>
                }
                pills={
                  <>
                    {thread.unread_customer_count > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ef3b18] px-1.5 text-[10px] font-semibold text-white">
                        {thread.unread_customer_count}
                      </span>
                    )}
                    <ManagePill tone={thread.status === "open" ? "active" : "muted"}>
                      {thread.status === "open" ? "Open" : "Closed"}
                    </ManagePill>
                  </>
                }
              />
            );
          })}
        </ManageList>
      )}
    </div>
  );
}
