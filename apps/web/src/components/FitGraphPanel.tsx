"use client";

import { FormEvent, useState } from "react";
import { vynedresClientApi, type FitGraph } from "@/lib/api";
import { MEASUREMENT_FIELDS, formatMeasurementValue } from "@/lib/measurements";
import { confidenceTextClass } from "@/lib/fit-confidence";
import { MeasurementDeltaBars } from "@/components/MeasurementDeltaBars";
import { FittingTimeline } from "@/components/FittingTimeline";

type FitGraphPanelProps = {
  tenantSlug: string;
  orderId: string;
  orderStatus: string;
  onGraphChange?: () => void;
};

export function FitGraphPanel({
  tenantSlug,
  orderId,
  orderStatus,
  onGraphChange,
}: FitGraphPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<FitGraph | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);

  async function loadGraph() {
    setLoading(true);
    setError(null);
    try {
      const data = await vynedresClientApi.getFitGraph(tenantSlug, orderId);
      setGraph(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Fit Graph");
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !graph) {
      await loadGraph();
    }
  }

  async function handleFittingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const measurements: Record<string, number | string> = { unit: "cm" };

    for (const { key } of MEASUREMENT_FIELDS) {
      const raw = formData.get(key);
      if (raw && String(raw).trim()) {
        measurements[key] = Number(raw);
      }
    }

    try {
      const result = await vynedresClientApi.addFittingRound(tenantSlug, orderId, {
        label: String(formData.get("label") || "").trim() || undefined,
        measurements,
        alterations: String(formData.get("alterations") || "").trim() || undefined,
        notes: String(formData.get("notes") || "").trim() || undefined,
      });
      setGraph(result.graph);
      setShowRoundForm(false);
      form.reset();
      onGraphChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save fitting round");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOutcomeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(form);

    try {
      const result = await vynedresClientApi.recordOrderOutcome(tenantSlug, orderId, {
        fitSuccess: formData.get("fitSuccess") === "yes",
        remakeRequired: formData.get("remakeRequired") === "yes",
        notes: String(formData.get("notes") || "").trim() || undefined,
      });
      setGraph(result.graph);
      setShowOutcomeForm(false);
      onGraphChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record outcome");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-vynedres-ink/10 pt-3">
      <button
        type="button"
        onClick={toggleOpen}
        className="text-sm text-vynedres-golddeep hover:underline"
      >
        {open ? "Hide Fit Graph" : "Fit Graph — measurements & fitting deltas"}
      </button>

      {open && (
        <div className="mt-3 space-y-4 text-sm">
          {loading && <p className="text-vynedres-ink/55">Loading Fit Graph…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {graph && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`font-medium ${confidenceTextClass(graph.fitConfidence)}`}>
                  Fit confidence: {graph.fitConfidence}%
                </span>
                {graph.totalAlerts > 0 && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600">
                    {graph.totalAlerts} delta alert{graph.totalAlerts === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <FittingTimeline graph={graph} />

              {graph.baseline && (
                <div className="rounded-lg bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-wide text-vynedres-ink/50">
                      Baseline — {graph.baseline.label}
                    </p>
                    {graph.baseline.submittedVia === "PORTAL" && (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-600">
                        Client portal
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                    {MEASUREMENT_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <span className="text-vynedres-ink/50">{label}</span>
                        <p>{formatMeasurementValue(graph.baseline!.data[key])} cm</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {graph.fittingRounds.length === 0 ? (
                <p className="text-vynedres-ink/55">No fitting rounds recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {graph.fittingRounds.map((round) => (
                    <li key={round.id} className="rounded-lg bg-white p-3">
                      <p className="font-medium">
                        {round.label} (round {round.roundNumber})
                      </p>
                      <MeasurementDeltaBars
                        title={`Deltas from ${round.roundNumber === 1 ? "baseline" : `fitting ${round.roundNumber - 1}`}`}
                        deltas={round.deltasFromPrevious}
                      />
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                        {MEASUREMENT_FIELDS.map(({ key, label }) => {
                          const delta = round.deltasFromPrevious.find((d) => d.field === key);
                          return (
                            <div key={key}>
                              <span className="text-vynedres-ink/50">{label}</span>
                              <p>
                                {formatMeasurementValue(round.measurements[key])} cm
                                {delta?.deltaCm != null && (
                                  <span
                                    className={
                                      Math.abs(delta.deltaCm) >= 2
                                        ? " text-amber-600"
                                        : " text-vynedres-ink/50"
                                    }
                                  >
                                    {" "}
                                    ({delta.deltaCm > 0 ? "+" : ""}
                                    {delta.deltaCm})
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {round.alerts.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {round.alerts.map((alert) => (
                            <li
                              key={alert.field}
                              className={
                                alert.severity === "warning"
                                  ? "text-red-600"
                                  : "text-amber-600"
                              }
                            >
                              {alert.message}
                            </li>
                          ))}
                        </ul>
                      )}
                      {round.alterations && (
                        <p className="mt-2 text-xs text-vynedres-ink/55">
                          Alterations: {round.alterations}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {graph.outcome && (
                <div className="rounded-lg border border-vynedres-ink/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-vynedres-ink/50">
                    Delivery outcome
                  </p>
                  <p className="mt-1">
                    {graph.outcome.fitSuccess ? "Good fit" : "Fit issues noted"}
                    {graph.outcome.remakeRequired && " · Remake required"}
                  </p>
                  {graph.outcome.notes && (
                    <p className="mt-1 text-vynedres-ink/55">{graph.outcome.notes}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoundForm(!showRoundForm)}
                  className="rounded border border-vynedres-gold/40 px-3 py-1 text-xs text-vynedres-golddeep hover:bg-vynedres-gold/10"
                >
                  {showRoundForm ? "Cancel" : "+ Record fitting round"}
                </button>
                {(orderStatus === "READY" || orderStatus === "DELIVERED") && (
                  <button
                    type="button"
                    onClick={() => setShowOutcomeForm(!showOutcomeForm)}
                    className="rounded border border-vynedres-ink/15 px-3 py-1 text-xs text-vynedres-ink/75 hover:bg-vynedres-ink/[0.04]"
                  >
                    {showOutcomeForm ? "Cancel" : "Record delivery outcome"}
                  </button>
                )}
              </div>

              {showRoundForm && (
                <form onSubmit={handleFittingSubmit} className="space-y-3 rounded-lg bg-white p-4">
                  <input
                    name="label"
                    placeholder="Label (e.g. First fitting)"
                    className="w-full rounded border border-vynedres-ink/10 bg-transparent px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {MEASUREMENT_FIELDS.map(({ key, label }) => (
                      <label key={key} className="text-xs">
                        <span className="text-vynedres-ink/55">{label} (cm)</span>
                        <input
                          name={key}
                          type="number"
                          step="0.1"
                          defaultValue={
                            graph.fittingRounds.at(-1)?.measurements[key] ??
                            graph.baseline?.data[key] ??
                            ""
                          }
                          className="mt-1 w-full rounded border border-vynedres-ink/10 bg-transparent px-2 py-1"
                        />
                      </label>
                    ))}
                  </div>
                  <textarea
                    name="alterations"
                    placeholder="Alterations noted at this fitting"
                    rows={2}
                    className="w-full rounded border border-vynedres-ink/10 bg-transparent px-3 py-2 text-sm"
                  />
                  <textarea
                    name="notes"
                    placeholder="Notes"
                    rows={2}
                    className="w-full rounded border border-vynedres-ink/10 bg-transparent px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-vynedres-gold px-4 py-2 text-sm font-medium text-vynedres-charcoal disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save fitting round"}
                  </button>
                </form>
              )}

              {showOutcomeForm && (
                <form onSubmit={handleOutcomeSubmit} className="space-y-3 rounded-lg bg-white p-4">
                  <label className="block text-xs">
                    <span className="text-vynedres-ink/55">Fit successful?</span>
                    <select
                      name="fitSuccess"
                      defaultValue={graph.outcome?.fitSuccess ? "yes" : "no"}
                      className="mt-1 w-full rounded border border-vynedres-ink/10 bg-white px-2 py-1"
                    >
                      <option value="yes">Yes — good fit</option>
                      <option value="no">No — issues</option>
                    </select>
                  </label>
                  <label className="block text-xs">
                    <span className="text-vynedres-ink/55">Remake required?</span>
                    <select
                      name="remakeRequired"
                      defaultValue={graph.outcome?.remakeRequired ? "yes" : "no"}
                      className="mt-1 w-full rounded border border-vynedres-ink/10 bg-white px-2 py-1"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Outcome notes"
                    rows={2}
                    defaultValue={graph.outcome?.notes ?? ""}
                    className="w-full rounded border border-vynedres-ink/10 bg-transparent px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-vynedres-gold px-4 py-2 text-sm font-medium text-vynedres-charcoal disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save outcome"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
