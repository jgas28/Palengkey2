import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  listAdminFeedback,
  markFeedbackReviewed,
  reopenFeedback,
} from "@/services/api/adminFeedback";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderFeedback, FeedbackFilter } from "@/types/adminFeedback";
import { ManageHeader, ManageTabs } from "@/components/admin/AdminManageList";

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
  const [selected, setSelected] = useState<AdminOrderFeedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminFeedback", filter],
    queryFn: () => listAdminFeedback(filter),
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
    <div className="flex flex-col gap-4">
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
        onChange={setFilter}
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.feedback.data.length === 0 && (
        <EmptyState
          title="Nothing here."
          description="No feedback matches this filter."
        />
      )}

      {data && data.feedback.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {data.feedback.data.map((feedback) => (
            <li key={feedback.id}>
              <button
                type="button"
                onClick={() => openDetail(feedback)}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-accent" aria-hidden="true">
                    {"★".repeat(feedback.rating)}
                    {"☆".repeat(5 - feedback.rating)}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      feedback.status === "reviewed"
                        ? "text-status-delivered"
                        : "text-status-preparing"
                    }`}
                  >
                    {feedback.status === "reviewed" ? "Reviewed" : "New"}
                  </span>
                </div>
                {feedback.comment && (
                  <p className="line-clamp-2 text-sm text-text">{feedback.comment}</p>
                )}
                <span className="text-xs text-text-muted">
                  {feedback.is_anonymous
                    ? "Anonymous"
                    : `${feedback.customer?.fname ?? ""} ${feedback.customer?.lname ?? ""}`}
                  {feedback.order && ` · Order #${feedback.order.order_number}`}
                  {feedback.market && ` · ${feedback.market.name}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
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
                className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
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
