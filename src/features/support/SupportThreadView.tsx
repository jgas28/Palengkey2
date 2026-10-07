import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import ChatThreadPanel from "@/features/support/ChatThreadPanel";

/** The design's full-page support chat, on a real per-order support thread. */
export default function SupportThreadView() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  return (
    <main className="inner-page chat-page">
      <div className="shell chat-shell">
        <header className="chat-header">
          <button type="button" onClick={() => navigate("/support")} aria-label="Back to support">
            <Icon name="arrow" />
          </button>
          <span>
            <Icon name="message" />
          </span>
          <div>
            <strong>Palengkey Customer Care</strong>
            <small>
              <i></i> Real people · replies during market hours
            </small>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/faq")}>
            Help center
          </button>
        </header>
        <ChatThreadPanel threadId={Number(threadId)} />
        <div className="chat-safety">
          <Icon name="shield" size={13} /> Messages go to the Palengkey customer care team for this order.
        </div>
      </div>
    </main>
  );
}
