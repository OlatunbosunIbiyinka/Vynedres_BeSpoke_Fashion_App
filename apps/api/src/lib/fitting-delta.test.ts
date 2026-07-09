import { describe, expect, it } from "vitest";
import { compareMeasurements } from "./fitting-delta.js";

describe("compareMeasurements", () => {
  it("flags large waist changes", () => {
    const { alerts } = compareMeasurements(
      { waist: 76 },
      { waist: 79 },
    );
    expect(alerts.some((a) => a.field === "waist")).toBe(true);
  });

  it("returns no alerts for small changes", () => {
    const { alerts } = compareMeasurements(
      { waist: 76 },
      { waist: 77 },
    );
    expect(alerts).toHaveLength(0);
  });
});
