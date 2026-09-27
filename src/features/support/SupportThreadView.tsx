import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { getSupportMessages, sendSupportMessage } from "@/services/api/support";
import { useToastStore } from "@/stores/toastStore";

export default function SupportThreadView() {
  const { threadId } = useParams<{ threadId: string }>();
  const id = Number(threadId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["supportMessages", id],
    queryFn: () => getSupportMessages(id),
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendSupportMessage(id, text),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["supportMessages", id] });
      void queryClient.invalidateQueries({ queryKey: ["support"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not send message.",
        "error",
      );
    },
  });

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/support")}
          aria-label="Back to conversations"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-text">Support</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-0.5 ${
                message.sender_type === "customer" ? "items-end" : "items-start"
              }`}
            >
              <span className="text-xs text-text-muted">{message.sender_name}</span>
              <div
                className={`max-w-[80%] rounded-card px-3.5 py-2.5 text-sm shadow-soft ${
                  message.sender_type === "customer"
                    ? "bg-primary-500 text-white"
                    : "bg-surface text-text"
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
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button
          variant="solid"
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
