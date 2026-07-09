import { confidenceBgClass } from "@/lib/fit-confidence";
import type { FitSummary } from "@/lib/api";

type FitConfidenceBadgeProps = {
  summary: FitSummary | undefined;
};

export function FitConfidenceBadge({ summary }: FitConfidenceBadgeProps) {
  if (!summary) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceBgClass(summary.fitConfidence)}`}
        title="Fit confidence from baseline → fittings → outcome"
      >
        Fit {summary.fitConfidence}%
      </span>
      {summary.totalAlerts > 0 && (
        <span
          className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600"
          title="Measurement delta alerts"
        >
          {summary.totalAlerts} alert{summary.totalAlerts === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
