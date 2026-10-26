import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** md (default) for short forms; lg / xl for long two-column forms. */
  size?: "md" | "lg" | "xl";
  children: ReactNode;
}

const WIDTHS = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

/**
 * Never taller than the screen: the title stays put and the content scrolls,
 * so long add/edit forms keep their Save button reachable.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-2rem)] w-full ${WIDTHS[size]} animate-scale-in flex-col overflow-hidden rounded-card bg-surface shadow-lifted focus:outline-none`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full text-text-muted hover:bg-background hover:text-text"
            >
              ✕
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
