import { useEffect, useState } from "react";
import Icon from "@/components/pk/Icon";
import type { PolicyBlock, PolicyDocument } from "@/content/policies/types";

export interface PkPolicyPageProps {
  kicker: string;
  title: string;
  description: string;
  /** One per language; a switch shows when there's more than one. */
  versions: PolicyDocument[];
}

function sectionFromHash(doc: PolicyDocument): string | null {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return doc.sections.some((s) => s.id === hash) ? hash : null;
}

/** A policy section's paragraphs, subheadings and lists (also used by PkPolicyModal). */
export function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "p") return <p key={i}>{block.text}</p>;
        if (block.type === "subheading") return <h3 key={i}>{block.text}</h3>;
        return (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>
                {item.label && <strong>{item.label} </strong>}
                {item.text}
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

/**
 * Privacy policy / terms: hero, a section index, and an accordion with one
 * section open at a time. Picking a section (index, heading or #link) opens it
 * and scrolls to it.
 */
export default function PkPolicyPage({
  kicker,
  title,
  description,
  versions,
}: PkPolicyPageProps) {
  const [versionIndex, setVersionIndex] = useState(0);
  const doc = versions[versionIndex];
  const [openId, setOpenId] = useState<string | null>(
    () => sectionFromHash(versions[0]) ?? versions[0].sections[0]?.id ?? null,
  );
  // A new object per request, so picking the same section again still scrolls.
  const [scrollTo, setScrollTo] = useState<{ id: string } | null>(() => {
    const id = sectionFromHash(versions[0]);
    return id ? { id } : null;
  });

  // Scroll once the picked section has opened (its height changes when it does).
  // Next tick: on arrival, the app's ScrollToTop runs after this and would cut
  // a smooth scroll short.
  useEffect(() => {
    if (!scrollTo) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(scrollTo.id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scrollTo]);

  function select(id: string, scroll: boolean) {
    setOpenId(id);
    window.history.replaceState(window.history.state, "", `#${id}`);
    if (scroll) setScrollTo({ id });
  }

  function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    select(id, false);
  }

  function switchVersion(index: number) {
    // Keep the same section open: section ids differ by language, positions don't.
    const position = doc.sections.findIndex((s) => s.id === openId);
    const next = versions[index];
    setVersionIndex(index);
    const nextId = position >= 0 ? next.sections[position]?.id : null;
    if (nextId) select(nextId, false);
    else setOpenId(null);
  }

  return (
    <main className="inner-page account-bg">
      <section className="delivery-hero">
        <div className="shell">
          <p className="kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
      <section className="section shell delivery-content policy-page">
        <aside aria-label="Sections">
          {doc.sections.map((section) => (
            <a
              href={`#${section.id}`}
              key={section.id}
              className={openId === section.id ? "active" : undefined}
              aria-current={openId === section.id ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                select(section.id, true);
              }}
            >
              {section.title}
            </a>
          ))}
        </aside>
        <div>
          <div className="policy-intro">
            <div className="policy-meta">
              <h2>{doc.title}</h2>
              {versions.length > 1 && (
                <div className="policy-lang" role="group" aria-label="Language">
                  {versions.map((version, index) => (
                    <button
                      type="button"
                      key={version.language}
                      className={index === versionIndex ? "active" : undefined}
                      aria-pressed={index === versionIndex}
                      onClick={() => switchVersion(index)}
                    >
                      {version.language}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <small>Last updated: {doc.lastUpdated}</small>
            {doc.intro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {doc.sections.map((section) => {
            const open = openId === section.id;
            return (
              <div
                key={section.id}
                id={section.id}
                className={`policy-item${open ? " open" : ""}`}
              >
                <h2>
                  <button
                    type="button"
                    className="policy-toggle"
                    aria-expanded={open}
                    aria-controls={`${section.id}-panel`}
                    onClick={() => toggle(section.id)}
                  >
                    <span className="policy-icon">
                      <Icon name={section.icon} />
                    </span>
                    <span className="policy-title">{section.title}</span>
                    <Icon name="chevron" className="policy-chevron" />
                  </button>
                </h2>
                <div
                  id={`${section.id}-panel`}
                  className="policy-panel"
                  role="region"
                  aria-label={section.title}
                  hidden={!open}
                >
                  <PolicyBlocks blocks={section.blocks} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
