import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type Side = "left" | "right" | "bottom";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  children: ReactNode;
}

const sideClasses: Record<Side, string> = {
  left: "inset-y-0 left-0 h-full w-full max-w-sm animate-fade-in",
  right: "inset-y-0 right-0 h-full w-full max-w-sm animate-fade-in",
  bottom: "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-sheet animate-sheet-up",
};

export default function Drawer({
  isOpen,
  onClose,
  side = "bottom",
  title,
  children,
}: DrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
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
        className={`absolute overflow-y-auto bg-surface p-6 shadow-lifted focus:outline-none ${sideClasses[side]}`}
      >
        {side === "bottom" && (
          <div className="sticky -top-6 -mx-6 -mt-6 mb-2 flex justify-center bg-surface pb-2 pt-3">
            <span className="h-1.5 w-10 rounded-pill bg-border" aria-hidden="true" />
          </div>
        )}
        {title && <h2 className="mb-4 text-lg font-semibold text-text">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
