/**
 * Stops a form (or a `data-submit-once` button) from firing twice when it's
 * double-clicked or Enter is pressed twice — before React has re-rendered the
 * button as disabled. Each form/button disables itself while its request runs;
 * this only covers that first fraction of a second.
 *
 * Runs in the capture phase on window, ahead of React's listeners on #root.
 */
const WINDOW_MS = 1000;
const lastFired = new WeakMap<EventTarget, number>();

function firedRecently(target: EventTarget, event: Event): boolean {
  const now = event.timeStamp || performance.now();
  const last = lastFired.get(target);
  if (last !== undefined && now - last < WINDOW_MS) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  lastFired.set(target, now);
  return false;
}

export function installDoubleSubmitGuard(): void {
  window.addEventListener(
    "submit",
    (event) => {
      if (event.target instanceof HTMLFormElement) firedRecently(event.target, event);
    },
    true,
  );
  window.addEventListener(
    "click",
    (event) => {
      const button = (event.target as Element | null)?.closest?.("[data-submit-once]");
      if (button) firedRecently(button, event);
    },
    true,
  );
}
