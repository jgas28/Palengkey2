import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/pk/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface PkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  /** Hero photo at the top (.drawer-photo). */
  photo?: ReactNode;
  /** Sticky footer (.drawer-action) — price + primary action. */
  action?: ReactNode;
  children: ReactNode;
}

/** The design's right-side sheet (.recipe-drawer) — bottom sheet on mobile, via the stylesheet. */
export default function PkDrawer({ isOpen, onClose, label, photo, action, children }: PkDrawerProps) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        ref={ref}
        className="recipe-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        {photo && <div className="drawer-photo">{photo}</div>}
        <div className="drawer-content">{children}</div>
        {action && <div className="drawer-action">{action}</div>}
      </aside>
    </div>,
    document.body,
  );
}
