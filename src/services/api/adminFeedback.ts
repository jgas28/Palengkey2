import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminFeedbackPage,
  AdminOrderFeedback,
  FeedbackCounts,
  FeedbackFilter,
} from "@/types/adminFeedback";

export async function listAdminFeedback(
  filter: FeedbackFilter,
): Promise<{ feedback: AdminFeedbackPage; counts: FeedbackCounts }> {
  const { data } = await adminApiClient.get<{
    feedback: AdminFeedbackPage;
    counts: FeedbackCounts;
  }>("/admin/feedback", { params: { filter } });
  return data;
}

export async function getAdminFeedback(feedbackId: number): Promise<AdminOrderFeedback> {
  const { data } = await adminApiClient.get<AdminOrderFeedback>(
    `/admin/feedback/${feedbackId}`,
  );
  return data;
}

export async function markFeedbackReviewed(
  feedbackId: number,
  adminNotes?: string,
): Promise<AdminOrderFeedback> {
  const { data } = await adminApiClient.post<AdminOrderFeedback>(
    `/admin/feedback/${feedbackId}/mark-reviewed`,
    { admin_notes: adminNotes },
  );
  return data;
}

export async function reopenFeedback(feedbackId: number): Promise<AdminOrderFeedback> {
  const { data } = await adminApiClient.post<AdminOrderFeedback>(
    `/admin/feedback/${feedbackId}/reopen`,
  );
  return data;
}
