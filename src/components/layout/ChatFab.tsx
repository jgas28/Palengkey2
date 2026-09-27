import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

// Figma's reference chat bubble opens a fake bot with scripted replies.
// This links to the real support-thread system instead of simulating a
// conversation that doesn't actually exist.
export default function ChatFab() {
  return (
    <Link
      to="/support"
      aria-label="Contact support"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0097A7] text-white shadow-lg transition-all hover:bg-[#006D77] active:scale-95 md:bottom-6"
      style={{ boxShadow: "0 4px 20px rgba(0,151,167,0.4)" }}
    >
      <MessageCircle size={24} aria-hidden="true" />
    </Link>
  );
}
