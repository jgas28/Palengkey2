import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  approveAdminVerification,
  approveAdminVerificationAccount,
  getAdminVerification,
  listAdminVerifications,
  rejectAdminVerification,
  rejectAdminVerificationAccount,
} from "@/services/api/adminVerifications";
import { useToastStore } from "@/stores/toastStore";
import type { AdminVerificationEntry, VerificationFilter } from "@/types/adminVerification";

const FILTERS: { value: VerificationFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function AdminVerifications() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [filter, setFilter] = useState<VerificationFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AdminVerificationEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminVerifications", filter, search],
    queryFn: () => listAdminVerifications(filter, search || undefined),
  });

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["adminVerification", selectedEntry?.id],
    queryFn: () => getAdminVerification(selectedEntry!.latest_verification!.id),
    enabled: selectedEntry !== null && selectedEntry.latest_verification !== null,
  });

  function closeModal() {
    setSelectedEntry(null);
    setNotes("");
    setRejectReason("");
    setShowRejectForm(false);
  }

  function invalidateAndClose(message: string) {
    void queryClient.invalidateQueries({ queryKey: ["adminVerifications"] });
    showToast(message, "success");
    closeModal();
  }

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!selectedEntry) throw new Error("No customer selected.");
      return detail
        ? approveAdminVerification(detail.id, notes || undefined)
        : approveAdminVerificationAccount(selectedEntry.id, notes || undefined);
    },
    onSuccess: () => invalidateAndClose("Approved. Customer notified by email."),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not approve.", "error");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!selectedEntry) throw new Error("No customer selected.");
      return detail
        ? rejectAdminVerification(detail.id, rejectReason)
        : rejectAdminVerificationAccount(selectedEntry.id, rejectReason);
    },
    onSuccess: () => invalidateAndClose("Rejected. Customer notified by email."),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not reject.", "error");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Customer Verification</h1>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              filter === item.value
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {item.label}
            {data && ` (${data.counts[item.value]})`}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone, ID number..."
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {data && data.entries.data.length === 0 && (
        <EmptyState
          title="Nothing here."
          description="No customers match this filter."
        />
      )}

      {data && data.entries.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {data.entries.data.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-text">
                    {entry.fname} {entry.lname}
                  </span>
                  <span className="text-xs font-semibold capitalize text-text-muted">
                    {entry.latest_verification?.status ?? entry.verification_status ?? "pending"}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {entry.email} · {entry.phone}
                </span>
                {entry.latest_verification && (
                  <span className="text-xs text-text-muted">
                    ID type: {entry.latest_verification.id_type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={selectedEntry !== null} onClose={closeModal} title="Verification review">
        {selectedEntry && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-medium text-text">
                {selectedEntry.fname} {selectedEntry.lname}
              </p>
              <p className="text-xs text-text-muted">
                {selectedEntry.email} · {selectedEntry.phone}
              </p>
            </div>

            {selectedEntry.latest_verification === null && (
              <p className="rounded-lg bg-surface-alt p-3 text-sm text-text-muted">
                No ID documents were submitted for this account. You can approve or reject
                the account registration itself.
              </p>
            )}

            {selectedEntry.latest_verification !== null && isDetailLoading && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}

            {detail && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-muted">ID type</p>
                    <p className="text-text">{detail.id_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">ID number</p>
                    <p className="text-text">{detail.id_number ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Full name on ID</p>
                    <p className="text-text">{detail.full_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Date of birth</p>
                    <p className="text-text">{detail.date_of_birth ?? "—"}</p>
                  </div>
                </div>

                {!detail.is_skipped && (
                  <div className="grid grid-cols-2 gap-3">
                    {detail.id_document_url && (
                      <a href={detail.id_document_url} target="_blank" rel="noreferrer">
                        <img
                          src={detail.id_document_url}
                          alt="ID document"
                          className="aspect-video w-full rounded-lg border border-border object-cover"
                        />
                      </a>
                    )}
                    {detail.selfie_url && (
                      <a href={detail.selfie_url} target="_blank" rel="noreferrer">
                        <img
                          src={detail.selfie_url}
                          alt="Selfie"
                          className="aspect-video w-full rounded-lg border border-border object-cover"
                        />
                      </a>
                    )}
                  </div>
                )}

                {detail.status !== "pending" && (
                  <p className="text-xs text-text-muted">
                    Already reviewed: {detail.status}
                    {detail.reviewed_by_user && ` by ${detail.reviewed_by_user.name}`}
                    {detail.review_notes && ` — "${detail.review_notes}"`}
                  </p>
                )}
              </div>
            )}

            {(selectedEntry.latest_verification === null || detail?.can_review) && (
              <>
                {!showRejectForm ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                      Approval notes (optional)
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </label>
                    <div className="flex gap-3">
                      <Button
                        loading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate()}
                      >
                        Approve
                      </Button>
                      <Button variant="secondary" onClick={() => setShowRejectForm(true)}>
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                      Rejection reason
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        minLength={5}
                        maxLength={500}
                        placeholder="Explain why this is being rejected so the customer knows what to fix."
                        className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </label>
                    <div className="flex gap-3">
                      <Button
                        variant="danger"
                        loading={rejectMutation.isPending}
                        disabled={rejectReason.trim().length < 5}
                        onClick={() => rejectMutation.mutate()}
                      >
                        Confirm rejection
                      </Button>
                      <Button variant="secondary" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
