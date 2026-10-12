import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { getSupportMessages, sendSupportMessage } from "@/services/api/support";
import { useToastStore } from "@/stores/toastStore";

/** Shortcuts that fill the message box — the conversation itself is with a real person. */
const QUICK_REPLIES = [
  "Where is my order?",
  "Payment problem",
  "Missing item",
  "Item quality issue",
  "Paluto help",
];

/**
 * A live support conversation (messages polled every 8s, quick replies, compose box) in
 * the design's chat styling. Rendered inside a `.chat-shell` grid by the support page
 * and by the floating chat widget.
 */
export default function ChatThreadPanel({ threadId }: { threadId: number }) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["supportMessages", threadId],
    queryFn: () => getSupportMessages(threadId),
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendSupportMessage(threadId, text),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["supportMessages", threadId] });
      void queryClient.invalidateQueries({ queryKey: ["support"] });
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not send message.",
        "error",
      ),
  });

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed) sendMutation.mutate(trimmed);
  }

  return (
    <>
      <section className="chat-messages">
        <div className="chat-date">Conversation</div>
        {isLoading && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 10 }}>
            Loading messages…
          </p>
        )}
        {isError && (
          <p style={{ textAlign: "center", fontSize: 10 }}>
            Couldn&apos;t load messages.{" "}
            <button
              type="button"
              onClick={() => void refetch()}
              style={{ color: "var(--teal-dark)", background: "none", border: 0 }}
            >
              Try again
            </button>
          </p>
        )}
        {!isLoading && messages.length === 0 && (
          <article className="bot">
            <span className="chat-avatar">
              <img src="/palengkey-mark.png" alt="" />
            </span>
            <div>
              <p>
                Kumusta! Tell us what you need help with and our team will reply here.
              </p>
            </div>
          </article>
        )}
        {messages.map((message) => {
          const mine = message.sender_type === "customer";
          return (
            <article className={mine ? "user" : "bot"} key={message.id}>
              {!mine && (
                <span>{message.sender_name.charAt(0).toUpperCase() || "PK"}</span>
              )}
              <div>
                <p>{message.body}</p>
                <small>
                  {mine ? "You" : message.sender_name}
                  {message.created_at ? ` · ${message.created_at}` : ""}
                </small>
              </div>
            </article>
          );
        })}
        {sendMutation.isPending && (
          <article className="user typing">
            <div>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </article>
        )}
        <div ref={endRef} />
      </section>

      <div className="quick-replies">
        {QUICK_REPLIES.map((reply) => (
          <button type="button" key={reply} onClick={() => setBody(reply)}>
            {reply}
          </button>
        ))}
      </div>

      <form className="chat-compose" onSubmit={handleSend}>
        <button
          type="button"
          aria-label="Add order details"
          onClick={() =>
            setBody((current) => `${current}${current ? " " : ""}Order details: `)
          }
        >
          <Icon name="plus" />
        </button>
        <input
          value={body}
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Type your message..."
          aria-label="Chat message"
        />
        <button
          type="submit"
          className="btn send-chat"
          disabled={!body.trim() || sendMutation.isPending}
          aria-label="Send"
        >
          <Icon name="arrow" />
        </button>
      </form>
    </>
  );
}
