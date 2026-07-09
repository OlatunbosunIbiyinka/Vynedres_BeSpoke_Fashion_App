import { formatDateGB } from "@/lib/dates";
import type { FitGraph, FitSummary } from "@/lib/api";

type TimelineStep = {
  key: string;
  label: string;
  date: string | null;
  status: "done" | "current" | "pending" | "warning" | "success" | "failed";
  detail?: string;
};

function stepDotClass(status: TimelineStep["status"]): string {
  switch (status) {
    case "done":
      return "border-vynedres-gold bg-vynedres-gold";
    case "current":
      return "border-vynedres-gold bg-vynedres-gold/30 ring-2 ring-vynedres-gold/40";
    case "warning":
      return "border-amber-400 bg-amber-400";
    case "success":
      return "border-emerald-400 bg-emerald-400";
    case "failed":
      return "border-red-400 bg-red-400";
    default:
      return "border-vynedres-ink/20 bg-transparent";
  }
}

function stepLabelClass(status: TimelineStep["status"]): string {
  if (status === "pending") return "text-vynedres-ink/45";
  if (status === "warning") return "text-amber-600";
  if (status === "failed") return "text-red-600";
  if (status === "success") return "text-emerald-600";
  return "text-vynedres-ink/75";
}

function buildStepsFromGraph(graph: FitGraph): TimelineStep[] {
  const steps: TimelineStep[] = [];

  if (graph.baseline) {
    steps.push({
      key: "baseline",
      label: graph.baseline.label,
      date: graph.baseline.createdAt,
      status: "done",
      detail: "Baseline measurements",
    });
  } else {
    steps.push({
      key: "baseline",
      label: "Baseline",
      date: null,
      status: "pending",
      detail: "No baseline recorded",
    });
  }

  for (const round of graph.fittingRounds) {
    const hasWarning = round.alerts.some((a) => a.severity === "warning");
    steps.push({
      key: round.id,
      label: round.label,
      date: round.createdAt,
      status: hasWarning ? "warning" : "done",
      detail:
        round.alerts.length > 0
          ? round.alerts.map((a) => a.message).join("; ")
          : round.alterations ?? undefined,
    });
  }

  if (graph.fittingRounds.length === 0 && graph.status === "FITTING") {
    steps.push({
      key: "fitting-pending",
      label: "First fitting",
      date: null,
      status: "current",
      detail: "Awaiting first fitting round",
    });
  }

  if (graph.outcome) {
    steps.push({
      key: "outcome",
      label: graph.outcome.fitSuccess ? "Delivered — good fit" : "Delivered — issues",
      date: graph.outcome.recordedAt,
      status: graph.outcome.remakeRequired
        ? "failed"
        : graph.outcome.fitSuccess
          ? "success"
          : "warning",
      detail: graph.outcome.notes ?? undefined,
    });
  } else if (graph.status === "DELIVERED" || graph.status === "READY") {
    steps.push({
      key: "outcome",
      label: "Delivery outcome",
      date: null,
      status: "current",
      detail: "Record fit outcome at handover",
    });
  } else {
    steps.push({
      key: "outcome",
      label: "Delivery",
      date: null,
      status: "pending",
    });
  }

  return steps;
}

function buildStepsFromSummary(summary: FitSummary): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      key: "baseline",
      label: "Baseline",
      date: null,
      status: summary.hasBaseline ? "done" : "pending",
    },
  ];

  if (summary.fittingRoundCount === 0) {
    steps.push({
      key: "fitting",
      label: "Fitting",
      date: null,
      status: "pending",
    });
  } else {
    for (let i = 1; i <= summary.fittingRoundCount; i++) {
      steps.push({
        key: `fitting-${i}`,
        label: `Fitting ${i}`,
        date: null,
        status: summary.totalAlerts > 0 && i === summary.fittingRoundCount ? "warning" : "done",
      });
    }
  }

  steps.push({
    key: "outcome",
    label: "Delivery",
    date: null,
    status: summary.hasOutcome
      ? summary.outcomeSuccess
        ? "success"
        : "failed"
      : "pending",
  });

  return steps;
}

function TimelineTrack({ steps, compact }: { steps: TimelineStep[]; compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-2 flex items-center" title="Fit journey: baseline → fittings → delivery">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            {index > 0 && (
              <span
                className={`h-px w-4 ${
                  step.status === "pending" ? "bg-white/15" : "bg-vynedres-gold/50"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`block rounded-full border-2 h-2.5 w-2.5 ${stepDotClass(step.status)}`}
              title={[step.label, step.detail].filter(Boolean).join(" — ")}
            />
            <span className="sr-only">{step.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ol className="flex items-start gap-0">
      {steps.map((step, index) => (
        <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            {index > 0 && (
              <span
                className={`mx-1 mb-3 h-px flex-1 ${
                  step.status === "pending" ? "bg-white/15" : "bg-vynedres-gold/50"
                }`}
                aria-hidden
              />
            )}
            <div
              className={`h-3 w-3 shrink-0 rounded-full border-2 ${stepDotClass(step.status)}`}
              title={step.detail ?? step.label}
            />
            {index < steps.length - 1 && (
              <span
                className={`mx-1 mb-3 h-px flex-1 ${
                  steps[index + 1]?.status === "pending" ? "bg-white/15" : "bg-vynedres-gold/50"
                }`}
                aria-hidden
              />
            )}
          </div>

          <div className="mt-2 w-full px-1 text-center">
            <p className={`truncate text-xs font-medium ${stepLabelClass(step.status)}`}>
              {step.label}
            </p>
            {step.date && (
              <p className="mt-0.5 text-[10px] text-vynedres-ink/50">{formatDateGB(step.date)}</p>
            )}
            {step.detail && step.status !== "pending" && (
              <p className="mt-1 line-clamp-2 text-[10px] text-vynedres-ink/50">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

type FittingTimelineProps =
  | { graph: FitGraph; summary?: never; compact?: boolean }
  | { summary: FitSummary; graph?: never; compact?: boolean };

export function FittingTimeline(props: FittingTimelineProps) {
  const compact = props.compact ?? false;
  const steps =
    "graph" in props && props.graph
      ? buildStepsFromGraph(props.graph)
      : buildStepsFromSummary(props.summary!);

  if (compact) {
    return <TimelineTrack steps={steps} compact />;
  }

  return (
    <div className="rounded-lg border border-vynedres-ink/10 bg-white p-4">
      <p className="mb-4 text-xs uppercase tracking-wide text-vynedres-ink/50">Fitting timeline</p>
      <TimelineTrack steps={steps} />
    </div>
  );
}
