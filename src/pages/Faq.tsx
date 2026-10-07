import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { FAQS } from "@/features/support/faqs";

const CATEGORIES = Array.from(new Set(FAQS.map((faq) => faq.category)));

/** The Help Center — the design's support page layout, with the full FAQ and search. */
export default function Faq() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesQuery = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      const matchesCategory = q ? true : !activeCategory || faq.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  return (
    <main className="inner-page account-bg">
      <section className="support-hero">
        <div className="shell">
          <p className="kicker">Help center</p>
          <h1>Answers for every market run.</h1>
          <p>Common questions about ordering, payment, delivery, and Paluto.</p>
          <div className="recipe-search" style={{ margin: "22px 0 0" }}>
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the help center…"
              aria-label="Search the help center"
            />
          </div>
        </div>
      </section>

      <div className="shell support-layout">
        <section>
          {!query && (
            <div className="filter-pills" style={{ display: "inline-flex", flexWrap: "wrap", marginBottom: 18 }}>
              <button type="button" className={activeCategory === null ? "active" : ""} onClick={() => setActiveCategory(null)}>
                All
              </button>
              {CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          <h2>{query ? `Results for “${query}”` : (activeCategory ?? "All questions")}</h2>
          {filtered.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12 }}>No answers match that search. Try “delivery”, “payment”, or “paluto”.</p>
          ) : (
            filtered.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <Icon name="plus" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))
          )}
        </section>

        <aside className="support-card">
          <span>
            <Icon name="message" />
          </span>
          <h2>Still need help?</h2>
          <p>Message our customer care team about an order, or email us anytime.</p>
          <Link className="btn chat-now" to="/support" style={{ display: "flex" }}>
            <Icon name="message" /> Message support <Icon name="arrow" />
          </Link>
          <div className="support-divider">
            <span>or email</span>
          </div>
          <a className="btn outline" href="mailto:contact@palengkey.ph" style={{ display: "flex", width: "100%" }}>
            contact@palengkey.ph
          </a>
        </aside>
      </div>
    </main>
  );
}
