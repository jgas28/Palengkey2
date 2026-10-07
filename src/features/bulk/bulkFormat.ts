/** "6", "6.5", "0.25" — kg without trailing zeros. */
export function formatKg(kg: number | string): string {
  return Number(Number(kg).toFixed(3)).toString();
}

/** Kg still needed to reach the bulk threshold (never negative). */
export function kgToGo(totalKg: number, thresholdKg: number): number {
  return Math.max(0, Math.round((thresholdKg - totalKg) * 1000) / 1000);
}
