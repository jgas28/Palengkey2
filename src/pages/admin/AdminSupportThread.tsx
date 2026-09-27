import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  closeAdminSupportThread,
  getAdminSupportMessages,
  getAdminSupportThread,
  reopenAdminSupportThread,
  sendAdminSupportMessage,
} from "@/services/api/adminSupport";
import { useToastStore } from "@/stores/toastStore";

export default function AdminSupportThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const id = Number(threadId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const {
    data: thread,
    isLoading: threadLoading,
    isError: threadError,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ["adminSupportThread", id],
    queryFn: () => getAdminSupportThread(id),
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["adminSupportMessages", id],
    queryFn: () => getAdminSupportMessages(id),
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendAdminSupportMessage(id, text),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["adminSupportMessages", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminSupportThreads"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not send message.",
        "error",
      );
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAdminSupportThread(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminSupportThread", id] });
      showToast("Thread closed.", "success");
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenAdminSupportThread(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminSupportThread", id] });
      showToast("Thread reopened.", "success");
    },
  });

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }

  if (threadLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (threadError || !thread) {
    return <ErrorState onRetry={() => void refetchThread()} />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/support")}
            aria-label="Back to conversations"
            className="text-text-muted"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-semibold">{thread.subject}</h1>
            <p className="text-xs text-text-muted">
              {thread.customer?.fname} {thread.customer?.lname}
              {thread.order && ` · Order #${thread.order.order_number}`}
            </p>
          </div>
        </div>
        {thread.status === "open" ? (
          <Button
            variant="secondary"
            size="sm"
            loading={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            Close
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={reopenMutation.isPending}
            onClick={() => reopenMutation.mutate()}
          >
            Reopen
          </Button>
        )}
      </div>

      {messagesLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {messagesError && <ErrorState onRetry={() => void refetchMessages()} />}

      {!messagesLoading && !messagesError && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messagesData?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-0.5 ${
                message.sender_type === "admin" ? "items-end" : "items-start"
              }`}
            >
              <span className="text-xs text-text-muted">{message.sender_name}</span>
              <div
                className={`max-w-[80%] rounded-card px-3 py-2 text-sm ${
                  message.sender_type === "admin"
                    ? "bg-gradient-brand text-white"
                    : "bg-primary-50 text-text"
                }`}
              >
                {message.body}
              </div>
              {message.created_at && (
                <span className="text-xs text-text-muted">{message.created_at}</span>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div className="flex gap-2 border-t border-border pt-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={1}
          placeholder="Type a reply…"
          className="flex-1 rounded-lg border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button
          loading={sendMutation.isPending}
          disabled={!body.trim()}
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
