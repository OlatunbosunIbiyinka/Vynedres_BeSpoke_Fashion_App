import { describe, expect, it } from "vitest";
import { validateMeasurementData } from "./portal-measurements.js";

describe("validateMeasurementData", () => {
  it("accepts valid measurements", () => {
    const result = validateMeasurementData({ chest: 92, waist: 76 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.chest).toBe(92);
      expect(result.data.unit).toBe("cm");
    }
  });

  it("rejects empty submissions", () => {
    const result = validateMeasurementData({});
    expect(result.ok).toBe(false);
  });

  it("rejects invalid numbers", () => {
    const result = validateMeasurementData({ chest: -1 });
    expect(result.ok).toBe(false);
  });
});
