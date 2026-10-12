import { useSearchParams } from "react-router-dom";

/**
 * The current step lives in `?step=` so refresh/back keep your place.
 * Returns [step, goToStep]; out-of-range or locked values fall back to step 1.
 */
export default function useWizardStep(count: number, isLocked: (stepId: number) => boolean = () => false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = Number(searchParams.get("step"));
  const step = requested >= 1 && requested <= count && !isLocked(requested) ? requested : 1;

  function goToStep(next: number) {
    setSearchParams(
      (params) => {
        const copy = new URLSearchParams(params);
        copy.set("step", String(next));
        return copy;
      },
      { replace: true },
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return [step, goToStep] as const;
}
