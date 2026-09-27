const WEIGHT_UNIT_LABELS = new Set([
  "kg",
  "kgs",
  "kilo",
  "kilos",
  "kilogram",
  "kilograms",
  "g",
  "gr",
  "gram",
  "grams",
]);

/** Mirrors Api\CartController::isWeightUnit()/normalizeUnitLabel() on the backend. */
export function isWeightUnit(unit: string | null): boolean {
  if (!unit) return false;
  const normalized = unit.toLowerCase().replace(/[^a-z]/g, "");
  return WEIGHT_UNIT_LABELS.has(normalized);
}
