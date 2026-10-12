import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { logout as logoutRequest } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";

/** Logged-in customer's photo, or initials on the brand teal→green avatar when there's none. */
function Avatar({ imageUrl, initials }: { imageUrl: string | null; initials: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: 36,
        height: 36,
        overflow: "hidden",
        color: "white",
        background: "linear-gradient(135deg, #0097a7 0%, #00838f 55%, #0a9137 130%)",
        border: "2px solid white",
        borderRadius: "50%",
        boxShadow: "0 0 0 1px var(--line)",
        fontFamily: "var(--display)",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {imageUrl && !failed ? (
        <img src={imageUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}

const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "10px 12px",
  color: "var(--ink)",
  background: "none",
  border: 0,
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 600,
  textAlign: "left",
} as const;

/** The header avatar — opens a menu with Profile, My orders and Log out. */
export default function AccountMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !ref.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = user
    ? `${user.fname?.charAt(0) ?? ""}${user.lname?.charAt(0) ?? ""}`.toUpperCase() || "P"
    : "P";

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // Best-effort — the local session is cleared regardless.
    } finally {
      await clearSession();
      setLoggingOut(false);
      setOpen(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", marginLeft: 6 }}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Account menu — ${user.fname} ${user.lname}` : "Account menu"}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar imageUrl={user?.profile_image ?? null} initials={initials} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 60,
            width: 220,
            padding: 8,
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 14,
            boxShadow: "var(--shadow)",
          }}
        >
          {user && (
            <div
              style={{
                padding: "8px 12px 10px",
                borderBottom: "1px solid var(--line)",
                marginBottom: 6,
              }}
            >
              <strong style={{ display: "block", fontSize: 13 }}>
                {user.fname} {user.lname}
              </strong>
              <small style={{ color: "var(--muted)", fontSize: 10 }}>{user.email}</small>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            style={itemStyle}
            onClick={() => go("/profile")}
          >
            <Icon name="shield" size={17} /> Profile
          </button>
          <button
            type="button"
            role="menuitem"
            style={itemStyle}
            onClick={() => go("/orders")}
          >
            <Icon name="bag" size={17} /> My orders
          </button>
          <button
            type="button"
            role="menuitem"
            style={{ ...itemStyle, color: "#b82f2f" }}
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            <Icon name="arrow" size={17} /> {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
