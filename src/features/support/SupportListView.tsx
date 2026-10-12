import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { FAQS } from "@/features/support/faqs";
import {
  getSupportOverview,
  openSupportForOrder,
  sendSupportMessage,
} from "@/services/api/support";
import { useToastStore } from "@/stores/toastStore";

/** The design's Help & Support page — FAQs, your conversations, and "create a ticket" for an order. */
export default function SupportListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["support"],
    queryFn: getSupportOverview,
  });

  const ticketMutation = useMutation({
    mutationFn: async () => {
      const thread = await openSupportForOrder(orderNumber);
      if (message.trim()) await sendSupportMessage(thread.id, message.trim());
      return thread;
    },
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      navigate(`/support/${thread.id}`);
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not start a conversation.",
        "error",
      ),
  });

  function handleTicket(event: FormEvent) {
    event.preventDefault();
    if (!orderNumber) {
      showToast("Choose the order you need help with.", "error");
      return;
    }
    ticketMutation.mutate();
  }

  const threads = data?.threads ?? [];
  const orders = data?.orders ?? [];

  return (
    <main className="inner-page account-bg">
      <section className="support-hero">
        <div className="shell">
          <p className="kicker">We’re here to help</p>
          <h1>Kumusta? How can we help?</h1>
          <p>Find a quick answer or send a message to our customer care team.</p>
        </div>
      </section>

      <div className="shell support-layout">
        <section>
          <p className="kicker">Frequently asked questions</p>
          <h2>Quick answers</h2>
          {FAQS.slice(0, 6).map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <Icon name="plus" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
          <p style={{ marginTop: 16, fontSize: 11 }}>
            <Link to="/faq" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
              See all FAQs →
            </Link>
          </p>

          {threads.length > 0 && (
            <>
              <h2 style={{ marginTop: 34 }}>Your conversations</h2>
              <div className="market-options">
                {threads.map((thread) => (
                  <button
                    type="button"
                    key={thread.id}
                    onClick={() => navigate(`/support/${thread.id}`)}
                  >
                    <span>
                      <Icon name="message" />
                    </span>
                    <div>
                      <strong>{thread.subject}</strong>
                      <p>{thread.latestMessage?.body ?? "No messages yet"}</p>
                      <small>{thread.status}</small>
                    </div>
                    <i>
                      <Icon name="chevron" size={16} />
                    </i>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="support-card">
          <span>
            <Icon name="message" />
          </span>
          <h2>Chat with customer care</h2>
          <p>
            Message our team about a specific order. We usually reply within a few minutes
            during market hours.
          </p>
          {threads[0] ? (
            <button
              type="button"
              className="btn chat-now"
              onClick={() => navigate(`/support/${threads[0].id}`)}
            >
              <Icon name="message" /> Open latest conversation <Icon name="arrow" />
            </button>
          ) : (
            <a
              className="btn chat-now"
              href="mailto:contact@palengkey.ph"
              style={{ display: "flex" }}
            >
              <Icon name="message" /> Email contact@palengkey.ph <Icon name="arrow" />
            </a>
          )}
          <div className="support-divider">
            <span>or create a ticket</span>
          </div>
          {isLoading ? (
            <p>Loading your orders…</p>
          ) : isError ? (
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          ) : orders.length === 0 ? (
            <div
              className="sent-message"
              style={{ color: "var(--muted)", background: "var(--bg)" }}
            >
              <strong>No orders yet</strong>
              <p>Once you place an order, you can message us about it here.</p>
            </div>
          ) : (
            <form onSubmit={handleTicket}>
              <label>
                Order number
                <select
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  style={{
                    width: "100%",
                    padding: 13,
                    border: "1px solid #cfdddd",
                    borderRadius: 10,
                    background: "white",
                  }}
                >
                  <option value="">Choose an order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.order_number}>
                      {order.order_number}
                      {order.supportThread ? " · has a conversation" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                How can we help?
                <textarea
                  value={message}
                  maxLength={2000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what happened..."
                />
              </label>
              <button
                type="submit"
                className="btn primary"
                disabled={ticketMutation.isPending}
              >
                {ticketMutation.isPending ? "Sending…" : "Send message"}{" "}
                <Icon name="arrow" />
              </button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
