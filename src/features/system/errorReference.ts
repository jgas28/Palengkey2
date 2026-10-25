/** Short code support can match to a report, e.g. PLK-500-K3F9Q. */
export function makeErrorReference(code: number | string = 500): string {
  return `PLK-${code}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}
