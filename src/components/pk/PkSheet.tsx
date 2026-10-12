import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/pk/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface PkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  kicker?: string;
  title: string;
  children: ReactNode;
}

/** The design's form side-sheet (.address-sheet) — used for adding addresses and picking one at checkout. */
export default function PkSheet({
  isOpen,
  onClose,
  kicker,
  title,
  children,
}: PkSheetProps) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        ref={ref}
        className="address-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" />
        </button>
        {kicker && <p className="kicker">{kicker}</p>}
        <h2>{title}</h2>
        {children}
      </aside>
    </div>,
    document.body,
  );
}
