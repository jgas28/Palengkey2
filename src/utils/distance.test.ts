import { describe, expect, it } from "vitest";
import { calculateDistanceKm } from "./distance";

describe("calculateDistanceKm", () => {
  it("returns 0 for the same point", () => {
    expect(calculateDistanceKm(14.6, 121.0, 14.6, 121.0)).toBeCloseTo(0, 5);
  });

  it("returns roughly the known distance between Manila and Quezon City landmarks", () => {
    // Manila City Hall to Quezon City Hall — roughly 11-12 km apart.
    const distance = calculateDistanceKm(14.5906, 120.9799, 14.6503, 121.0492);
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(15);
  });
});
