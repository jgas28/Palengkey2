import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import SystemShell from "@/features/system/SystemShell";

/** "Hindi namin makita ang hinahanap mo." — Figma 404 for any unknown address. */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <SystemShell
      variant="not-found-page"
      footnote="Fresh finds are waiting back at the palengke."
      footnoteIcon="leaf"
    >
      <div className="system-copy">
        <p className="system-kicker">
          <span /> Error 404
        </p>
        <h1>Hindi namin makita ang hinahanap mo.</h1>
        <p>
          This aisle seems to be empty. The page may have moved, or the link might no
          longer be available.
        </p>
        <div className="system-actions">
          <button type="button" className="btn primary" onClick={() => navigate("/")}>
            Back to home <Icon name="arrow" />
          </button>
          <button
            type="button"
            className="btn system-secondary"
            onClick={() => navigate("/shop")}
          >
            <Icon name="search" size={17} /> Browse the market
          </button>
        </div>
        <div className="popular-destinations">
          <span>Popular destinations</span>
          <button type="button" onClick={() => navigate("/orders")}>
            My orders
          </button>
          <button type="button" onClick={() => navigate("/recipes")}>
            Recipes
          </button>
          <button type="button" onClick={() => navigate("/paluto")}>
            Paluto
          </button>
        </div>
      </div>
      <div className="system-art not-found-art" aria-hidden="true">
        <span className="giant-four">4</span>
        <div className="empty-basket">
          <span className="basket-handle" />
          <div className="basket-body">
            <i />
            <i />
            <i />
          </div>
          <span className="basket-search">
            <Icon name="search" size={31} />
          </span>
        </div>
        <span className="giant-four last-four">4</span>
        <span className="art-leaf leaf-one">
          <Icon name="leaf" />
        </span>
        <span className="art-leaf leaf-two">
          <Icon name="leaf" />
        </span>
      </div>
    </SystemShell>
  );
}
