import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="inner-page account-bg">
      <section className="confirmation shell">
        <span style={{ background: "var(--teal)", boxShadow: "0 0 0 12px var(--teal-pale)" }}>
          <Icon name="search" size={38} />
        </span>
        <p className="kicker">Page not found</p>
        <h1>Walang nahanap.</h1>
        <p>The page you’re looking for doesn’t exist or may have moved.</p>
        <button type="button" className="btn primary" onClick={() => navigate("/shop")}>
          Back to the shop <Icon name="arrow" />
        </button>
        <button type="button" onClick={() => navigate("/")}>
          Go home
        </button>
      </section>
    </main>
  );
}
