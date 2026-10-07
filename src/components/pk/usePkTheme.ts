import { useEffect } from "react";

/**
 * Turns on the Figma design system (src/styles/palengkey.css) for the customer
 * app. The stylesheet is scoped to `body.pk`, so it's on the body — not a
 * wrapper — to also cover portalled drawers/modals, and it's removed again on
 * the way into /admin so none of it leaks into the CMS.
 */
export function usePkTheme(): void {
  useEffect(() => {
    document.body.classList.add("pk");
    return () => document.body.classList.remove("pk");
  }, []);
}
