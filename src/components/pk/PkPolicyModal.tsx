import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/pk/Icon";
import { PolicyBlocks } from "@/components/pk/PkPolicyPage";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { PolicyDocument } from "@/content/policies/types";

export interface PkPolicyModalProps {
  isOpen: boolean;
  /** One per language; a switch shows when there's more than one. */
  versions: PolicyDocument[];
  /** "Close" / Esc / backdrop: just closes. */
  onClose: () => void;
  /** "I understand": the caller ticks its agreement box. */
  onAccept: () => void;
}

/**
 * A policy read in place (registration), so leaving the form for the full
 * page doesn't lose what the customer typed.
 */
export default function PkPolicyModal({
  isOpen,
  versions,
  onClose,
  onAccept,
}: PkPolicyModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [versionIndex, setVersionIndex] = useState(0);
  useFocusTrap(ref, isOpen, onClose);

  // Start at the top each time it opens or the language changes.
  useEffect(() => {
    if (isOpen && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [isOpen, versionIndex]);

  if (!isOpen) return null;
  const doc = versions[versionIndex] ?? versions[0];
  const titleId = "policy-modal-title";

  return createPortal(
    <div className="policy-modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="policy-modal-head">
          <div>
            <h2 id={titleId}>{doc.title}</h2>
            <small>Last updated: {doc.lastUpdated}</small>
          </div>
          <button
            type="button"
            className="policy-modal-x"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="x" size={18} />
          </button>
          {versions.length > 1 && (
            <div className="policy-lang" role="group" aria-label="Language">
              {versions.map((version, index) => (
                <button
                  type="button"
                  key={version.language}
                  className={index === versionIndex ? "active" : undefined}
                  aria-pressed={index === versionIndex}
                  onClick={() => setVersionIndex(index)}
                >
                  {version.language}
                </button>
              ))}
            </div>
          )}
        </header>

        <div ref={bodyRef} className="policy-modal-body policy-panel">
          {doc.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          {doc.sections.map((section) => (
            <section key={section.id}>
              <h3 className="policy-modal-section">{section.title}</h3>
              <PolicyBlocks blocks={section.blocks} />
            </section>
          ))}
        </div>

        {/* Not <footer>: the site footer styles every footer element. */}
        <div className="policy-modal-foot">
          <button type="button" className="btn outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onAccept();
              onClose();
            }}
          >
            <Icon name="check" size={16} /> I understand
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
