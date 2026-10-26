import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus within containerRef while isOpen, closes on Escape, and
 * restores focus to the previously-focused element on close/unmount.
 *
 * onClose is read through a ref: callers usually pass a new function on every
 * render, and re-running the effect on each keystroke used to yank focus back
 * to the first field while typing.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Start in the first form field when there is one, not on the close button.
    const firstField = container.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );
    (firstField ?? getFocusable()[0] ?? container).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, containerRef]);
}
