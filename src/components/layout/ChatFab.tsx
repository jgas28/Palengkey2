import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import ChatThreadPanel from "@/features/support/ChatThreadPanel";
import { FAQS } from "@/features/support/faqs";
import { getSupportOverview, openSupportForOrder } from "@/services/api/support";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

type View = { name: "home" } | { name: "thread"; threadId: number; title: string };

const PANEL_STYLE = {
  position: "fixed",
  zIndex: 75,
  right: 24,
  bottom: 88,
  width: "min(380px, calc(100vw - 32px))",
  height: "min(640px, calc(100vh - 110px))",
  minHeight: 0,
  borderRadius: 22,
  animation: "modal-in .2s ease",
} as const;

/**
 * The design's chat bubble — opens a chat window over the current page.
 * Home: FAQ quick answers (real Help Center content) and your conversations;
 * Thread: a live conversation with the customer care team.
 */
export default function ChatFab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showToast = useToastStore((state) => state.showToast);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ name: "home" });
  const [answered, setAnswered] = useState<string[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: overview } = useQuery({
    queryKey: ["support"],
    queryFn: getSupportOverview,
    enabled: open && isAuthenticated,
  });

  const startMutation = useMutation({
    mutationFn: (number: string) => openSupportForOrder(number),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      setView({ name: "thread", threadId: thread.id, title: thread.subject });
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not start a conversation.",
        "error",
      ),
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const threads = overview?.threads ?? [];
  const orders = overview?.orders ?? [];
  const quickFaqs = FAQS.slice(0, 5);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="chat-shell chat-widget"
          role="dialog"
          aria-modal="false"
          aria-label="Chat with Palengkey"
          style={PANEL_STYLE}
        >
          <header
            className="chat-header"
            style={{
              gridTemplateColumns:
                view.name === "thread" ? "34px 39px 1fr 34px" : "39px 1fr 34px",
            }}
          >
            {view.name === "thread" && (
              <button
                type="button"
                onClick={() => setView({ name: "home" })}
                aria-label="Back"
              >
                <Icon name="arrow" />
              </button>
            )}
            <span className="chat-brand-mark">
              <img src="/palengkey-mark.png" alt="" />
            </span>
            <div>
              <strong>{view.name === "thread" ? view.title : "Palengkey Assist"}</strong>
              <small>
                <i></i>{" "}
                {view.name === "thread"
                  ? "Customer care team"
                  : "Quick answers & customer care"}
              </small>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                display: "grid",
                placeItems: "center",
                width: 34,
                height: 34,
                color: "white",
                background: "rgba(255,255,255,.08)",
                border: 0,
                borderRadius: "50%",
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </header>

          {view.name === "thread" ? (
            <ChatThreadPanel threadId={view.threadId} />
          ) : (
            <>
              <section className="chat-messages">
                <div className="chat-date">Today</div>
                <article className="bot">
                  <span className="chat-avatar">
                    <img src="/palengkey-mark.png" alt="" />
                  </span>
                  <div>
                    <p>
                      Kumusta! I’m Palengkey Assist. Tap a question below for a quick
                      answer, or message our team about an order.
                    </p>
                  </div>
                </article>
                {answered.map((question) => {
                  const faq = FAQS.find((entry) => entry.question === question);
                  return (
                    <div key={question}>
                      <article className="user">
                        <div>
                          <p>{question}</p>
                        </div>
                      </article>
                      <article className="bot">
                        <span className="chat-avatar">
                          <img src="/palengkey-mark.png" alt="" />
                        </span>
                        <div>
                          <p>{faq?.answer}</p>
                        </div>
                      </article>
                    </div>
                  );
                })}

                {isAuthenticated ? (
                  <article className="bot">
                    <span className="chat-avatar">
                      <img src="/palengkey-mark.png" alt="" />
                    </span>
                    <div style={{ width: "100%" }}>
                      <p style={{ marginBottom: 8 }}>
                        {threads.length > 0
                          ? "Continue a conversation:"
                          : "Need a person? Pick the order you need help with:"}
                      </p>
                      <div style={{ display: "grid", gap: 6 }}>
                        {threads.slice(0, 4).map((thread) => (
                          <button
                            type="button"
                            key={thread.id}
                            onClick={() =>
                              setView({
                                name: "thread",
                                threadId: thread.id,
                                title: thread.subject,
                              })
                            }
                            className="chat-option"
                          >
                            <span>{thread.subject}</span>
                            <Icon name="chevron" size={14} />
                          </button>
                        ))}
                        {orders.length > 0 && (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (orderNumber) startMutation.mutate(orderNumber);
                            }}
                            className="chat-order-picker"
                          >
                            <select
                              value={orderNumber}
                              onChange={(event) => setOrderNumber(event.target.value)}
                              aria-label="Order to get help with"
                            >
                              <option value="">Choose an order</option>
                              {orders.map((order) => (
                                <option key={order.id} value={order.order_number}>
                                  {order.order_number}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="btn primary"
                              disabled={!orderNumber || startMutation.isPending}
                            >
                              Chat
                            </button>
                          </form>
                        )}
                        {orders.length === 0 && threads.length === 0 && (
                          <p>
                            Once you place an order, you can message our team about it
                            here.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ) : (
                  <article className="bot">
                    <span className="chat-avatar">
                      <img src="/palengkey-mark.png" alt="" />
                    </span>
                    <div>
                      <p>To message our team about an order, please log in first.</p>
                      <button
                        type="button"
                        className="btn primary"
                        style={{
                          minHeight: 32,
                          marginTop: 8,
                          padding: "0 12px",
                          fontSize: 10,
                        }}
                        onClick={() => {
                          setOpen(false);
                          navigate("/login");
                        }}
                      >
                        Log in
                      </button>
                    </div>
                  </article>
                )}
              </section>

              <div className="quick-replies">
                <span className="quick-replies-label">Quick questions</span>
                {quickFaqs.map((faq) => (
                  <button
                    type="button"
                    key={faq.question}
                    onClick={() =>
                      setAnswered((current) =>
                        current.includes(faq.question)
                          ? current
                          : [...current, faq.question],
                      )
                    }
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
              <div className="chat-safety">
                <Icon name="shield" size={13} /> Quick answers come from our Help Center.
                A real person replies in conversations.
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="chat"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close chat" : "Chat with support"}
        aria-expanded={open}
      >
        <span></span>
        <Icon name={open ? "x" : "message"} />
      </button>
    </>
  );
}
