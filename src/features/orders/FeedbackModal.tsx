import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { submitOrderFeedback } from "@/services/api/feedback";
import { useToastStore } from "@/stores/toastStore";
import type { OrderFeedback } from "@/types/feedback";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  existingFeedback: OrderFeedback | null;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  orderId,
  existingFeedback,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(existingFeedback?.rating ?? 0);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [isAnonymous, setIsAnonymous] = useState(existingFeedback?.is_anonymous ?? false);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: () =>
      submitOrderFeedback({
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
        is_anonymous: isAnonymous,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orderFeedback", orderId] });
      showToast("Thanks for your feedback!", "success");
      onClose();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not submit feedback.",
        "error",
      );
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate your order">
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className={`text-4xl transition-transform duration-150 active:scale-90 ${star <= rating ? "text-accent" : "text-border"}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Tell us about your experience (optional)"
          className="rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-300"
        />

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Submit anonymously
        </label>

        <Button
          variant="solid"
          fullWidth
          disabled={rating === 0}
          loading={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {existingFeedback ? "Update feedback" : "Submit feedback"}
        </Button>
      </div>
    </Modal>
  );
}
