import { ApiError } from "@/services/api/apiError";

/**
 * Turns a failed sign-in request into a message a person can act on.
 * Covers: wrong details, too many attempts, server/connection down, and
 * Laravel validation errors (first field message).
 */
export function authErrorMessage(
  error: unknown,
  fallback = "We couldn't log you in. Please try again.",
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (error.status === undefined) {
    return "We can't reach Palengkey right now. Check your internet connection and try again.";
  }
  if (error.status === 429) {
    return "Too many login attempts. Please wait a minute, then try again.";
  }
  if (error.status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  if (error.status === 422) {
    const errors = (error.data as { errors?: Record<string, string[]> } | undefined)
      ?.errors;
    const first = errors && Object.values(errors)[0]?.[0];
    if (first) return first;
  }
  if (error.status === 401 && /invalid credentials/i.test(error.message)) {
    return "Incorrect email or password.";
  }
  return error.message || fallback;
}
