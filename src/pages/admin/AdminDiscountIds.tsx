import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { ManageHeader, ManageTabs, PagerBar } from "@/components/admin/AdminManageList";
import {
  approveAdminDiscountId,
  getAdminDiscountId,
  getAdminDiscountIdFile,
  listAdminDiscountIds,
  rejectAdminDiscountId,
} from "@/services/api/adminDiscountIds";
import { useToastStore } from "@/stores/toastStore";
import type { AdminDiscountId, DiscountIdFilter } from "@/types/discountId";

const FILTERS: { value: DiscountIdFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const SIDE_LABELS = { front: "Front", back: "Back", selfie: "Selfie with ID" } as const;

const textarea =
  "rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300";

/** One private ID photo, loaded with the admin's login and shown from memory. */
function IdPhoto({ id, side }: { id: number; side: keyof typeof SIDE_LABELS }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getAdminDiscountIdFile(id, side)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, side]);

  return (
    <figure className="flex flex-col gap-1">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={`${SIDE_LABELS[side]} of the ID`}
            className="aspect-video w-full rounded-lg border border-border bg-slate-50 object-contain"
          />
        </a>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border bg-slate-50 text-xs text-text-muted">
          {failed ? "Could not load photo" : <Spinner />}
        </div>
      )}
      <figcaption className="text-xs text-text-muted">{SIDE_LABELS[side]}</figcaption>
    </figure>
  );
}

/** Review customers' PWD / Senior Citizen IDs. Approved customers can turn on the discount at checkout. */
export default function AdminDiscountIds() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [filter, setFilter] = useState<DiscountIdFilter>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminDiscountId | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDiscountIds", filter, search, page],
    queryFn: () => listAdminDiscountIds(filter, search, page),
    placeholderData: keepPreviousData,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["adminDiscountId", selected?.id],
    queryFn: () => getAdminDiscountId(selected!.id),
    enabled: selected !== null,
  });

  function close() {
    setSelected(null);
    setNotes("");
    setRejectReason("");
    setRejecting(false);
  }

  function done(message: string) {
    void queryClient.invalidateQueries({ queryKey: ["adminDiscountIds"] });
    void queryClient.invalidateQueries({ queryKey: ["adminDiscountId"] });
    showToast(message, "success");
    close();
  }

  const approveMutation = useMutation({
    mutationFn: () => approveAdminDiscountId(selected!.id, notes.trim() || undefined),
    onSuccess: () => done("ID approved. The customer can now use the discount."),
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "Could not approve.", "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAdminDiscountId(selected!.id, rejectReason.trim()),
    onSuccess: () => done("ID rejected. The customer will see the reason."),
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "Could not reject.", "error"),
  });

  return (
    <div className="flex flex-col gap-4">
      <ManageHeader
        eyebrow="Customers"
        title="PWD / Senior IDs"
        description="Check each ID before customers can get 20% off the delivery fee. Confirm the name, ID number, and that the photos are clear and unedited."
      />

      <ManageTabs
        label="ID status"
        tabs={FILTERS.map((item) => ({
          value: item.value,
          label: item.label,
          count: data ? data.counts[item.value] : null,
        }))}
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
      />

      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search name, email, phone, ID number..."
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {data && data.discount_ids.data.length === 0 && (
        <EmptyState title="Nothing here." description="No IDs match this filter." />
      )}

      {data && data.discount_ids.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {data.discount_ids.data.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setSelected(entry)}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="font-medium text-text">{entry.full_name}</span>
                  <span className="text-xs font-semibold capitalize text-text-muted">
                    {entry.status}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {entry.type_label} · ID {entry.id_number}
                  {entry.customer && ` · ${entry.customer.email ?? entry.customer.phone ?? ""}`}
                </span>
                <span className="text-xs text-text-muted">
                  Submitted {new Date(entry.submitted_at).toLocaleString("en-PH")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {data && data.discount_ids.last_page > 1 && (
        <PagerBar
          page={data.discount_ids.current_page}
          lastPage={data.discount_ids.last_page}
          total={data.discount_ids.total}
          perPage={data.discount_ids.per_page}
          onPage={setPage}
        />
      )}

      <Modal isOpen={selected !== null} onClose={close} title="PWD / Senior ID review">
        {selected && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-medium text-text">{selected.customer?.name || "Customer"}</p>
              <p className="text-xs text-text-muted">
                {[selected.customer?.email, selected.customer?.phone].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-muted">ID type</p>
                <p className="text-text">{selected.type_label}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">ID number</p>
                <p className="text-text">{selected.id_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-muted">Full name on ID</p>
                <p className="text-text">{selected.full_name}</p>
              </div>
            </div>

            {detailLoading && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
            {detail && (
              <div className="grid grid-cols-2 gap-3">
                {detail.files.map((side) => (
                  <IdPhoto key={side} id={detail.id} side={side} />
                ))}
              </div>
            )}

            {detail && detail.status !== "pending" && (
              <p className="text-xs text-text-muted">
                Already reviewed: {detail.status}
                {detail.reviewed_by && ` by ${detail.reviewed_by}`}
                {detail.review_notes && ` — "${detail.review_notes}"`}
              </p>
            )}

            {detail?.status === "pending" &&
              (!rejecting ? (
                <>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    Approval notes (optional)
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className={textarea}
                    />
                  </label>
                  <div className="flex gap-3">
                    <Button
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    >
                      Approve
                    </Button>
                    <Button variant="secondary" onClick={() => setRejecting(true)}>
                      Reject
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
                    Reason (shown to the customer)
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. The photo is blurry, please upload a clearer one."
                      className={textarea}
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
                    <Button variant="secondary" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
