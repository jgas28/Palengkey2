import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Star } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import {
  listAdminFeedback,
  markFeedbackReviewed,
  reopenFeedback,
} from "@/services/api/adminFeedback";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderFeedback, FeedbackFilter } from "@/types/adminFeedback";
import {
  ManageHeader,
  ManageList,
  ManagePill,
  ManageRow,
  ManageTabs,
  PagerBar,
} from "@/components/admin/AdminManageList";

const FILTERS: { value: FeedbackFilter; label: string }[] = [
  { value: "bad", label: "Needs attention" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
  { value: "five_star", label: "5-star" },
  { value: "all", label: "All" },
];

export default function AdminFeedback() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [filter, setFilter] = useState<FeedbackFilter>("bad");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrderFeedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminFeedback", filter, page],
    queryFn: () => listAdminFeedback(filter, page),
    placeholderData: keepPreviousData,
  });

  const reviewMutation = useMutation({
    mutationFn: () => markFeedbackReviewed(selected!.id, adminNotes || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminFeedback"] });
      showToast("Marked as reviewed.", "success");
      setSelected(null);
      setAdminNotes("");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenFeedback(selected!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminFeedback"] });
      showToast("Moved back to review queue.", "success");
      setSelected(null);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not update.", "error");
    },
  });

  function openDetail(feedback: AdminOrderFeedback) {
    setSelected(feedback);
    setAdminNotes(feedback.admin_notes ?? "");
  }

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Customers"
        title="Suki trust level"
        description="Customer ratings and feedback after delivery."
      />

      <ManageTabs
        label="Trust level"
        tabs={FILTERS.map((item) => ({
          value: item.value,
          label: item.label,
          count: data && item.value !== "five_star" ? data.counts[item.value] : null,
        }))}
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
      />

      {isLoading && (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.feedback.data.length === 0 && (
        <Card>
          <EmptyPanel
            title="Nothing here."
            description="No feedback matches this filter."
          />
        </Card>
      )}

      {data && data.feedback.data.length > 0 && (
        <ManageList
          footer={
            <PagerBar
              page={data.feedback.current_page}
              lastPage={data.feedback.last_page}
              total={data.feedback.total}
              perPage={data.feedback.per_page}
              onPage={setPage}
            />
          }
        >
          {data.feedback.data.map((feedback) => {
            const who = feedback.is_anonymous
              ? "Anonymous"
              : `${feedback.customer?.fname ?? ""} ${feedback.customer?.lname ?? ""}`.trim() ||
                "Customer";
            return (
              <ManageRow
                key={feedback.id}
                onOpen={() => openDetail(feedback)}
                leading={
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${
                      feedback.rating <= 2
                        ? "bg-rose-50 text-rose-600"
                        : feedback.rating === 3
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span className="flex items-center gap-0.5">
                      {feedback.rating}
                      <Star size={12} className="fill-current" aria-hidden="true" />
                    </span>
                  </span>
                }
                title={feedback.comment || `${feedback.rating}-star rating`}
                subtitle={[
                  who,
                  feedback.order && `Order #${feedback.order.order_number}`,
                  feedback.market?.name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                pills={
                  <ManagePill
                    tone={feedback.status === "reviewed" ? "active" : "warning"}
                  >
                    {feedback.status === "reviewed" ? "Reviewed" : "New"}
                  </ManagePill>
                }
              />
            );
          })}
        </ManageList>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Feedback"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <span className="text-2xl text-accent" aria-hidden="true">
              {"★".repeat(selected.rating)}
              {"☆".repeat(5 - selected.rating)}
            </span>
            {selected.comment && <p className="text-sm text-text">{selected.comment}</p>}
            <p className="text-xs text-text-muted">
              {selected.is_anonymous
                ? "Anonymous"
                : `${selected.customer?.fname ?? ""} ${selected.customer?.lname ?? ""}`}
              {selected.order && ` · Order #${selected.order.order_number}`}
            </p>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Admin notes
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <div className="flex gap-3">
              {selected.status === "reviewed" ? (
                <Button
                  variant="secondary"
                  loading={reopenMutation.isPending}
                  onClick={() => reopenMutation.mutate()}
                >
                  Move back to review queue
                </Button>
              ) : (
                <Button
                  loading={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate()}
                >
                  Mark reviewed
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
