import { describe, expect, it } from "vitest";
import { routeIntent } from "./assistant.js";

describe("routeIntent", () => {
  it("routes fit questions phrased as 'at risk of fit' to fit_risk (not delay)", () => {
    expect(routeIntent("Are any clothes at risk of fit")).toBe("fit_risk");
  });

  it("routes common fit-quality phrasings to fit_risk", () => {
    const questions = [
      "Which garments have fit issues?",
      "Any orders with low fit confidence?",
      "Is anything likely to need a remake?",
      "Which clothes might fit badly?",
      "Are any pieces too tight or loose?",
      "Show measurement anomalies",
    ];
    for (const q of questions) {
      expect(routeIntent(q), q).toBe("fit_risk");
    }
  });

  it("keeps schedule questions on delay_risk", () => {
    const questions = [
      "Which orders are likely to be delayed?",
      "Anything overdue?",
      "What is behind schedule?",
      "Which orders will miss their deadline?",
    ];
    for (const q of questions) {
      expect(routeIntent(q), q).toBe("delay_risk");
    }
  });

  it("routes processing-time and pipeline questions correctly", () => {
    expect(routeIntent("What is the average order processing time?")).toBe(
      "avg_processing_time",
    );
    expect(routeIntent("How many orders are in progress?")).toBe(
      "pipeline_summary",
    );
  });

  it("falls back to help for unrelated questions", () => {
    expect(routeIntent("What's the weather today?")).toBe("help");
  });
});
