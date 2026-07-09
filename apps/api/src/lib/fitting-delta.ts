/** Fitting Delta Engine — compares measurement snapshots and flags anomalies. */

export const MEASUREMENT_KEYS = [
  "chest",
  "waist",
  "hips",
  "shoulder",
  "sleeve",
  "inseam",
] as const;

export type MeasurementSnapshot = Record<string, number | string>;

export type DeltaAlert = {
  field: string;
  from: number;
  to: number;
  deltaCm: number;
  severity: "watch" | "warning";
  message: string;
};

export type FieldDelta = {
  field: string;
  from: number | null;
  to: number;
  deltaCm: number | null;
};

const THRESHOLDS: Record<string, number> = {
  chest: 3,
  waist: 3,
  hips: 3,
  shoulder: 2,
  sleeve: 2,
  inseam: 2,
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function compareMeasurements(
  previous: MeasurementSnapshot | null,
  current: MeasurementSnapshot,
): { deltas: FieldDelta[]; alerts: DeltaAlert[] } {
  const deltas: FieldDelta[] = [];
  const alerts: DeltaAlert[] = [];

  for (const field of MEASUREMENT_KEYS) {
    const to = toNumber(current[field]);
    if (to === null) continue;

    const from = previous ? toNumber(previous[field]) : null;
    const deltaCm = from !== null ? Math.round((to - from) * 10) / 10 : null;

    deltas.push({ field, from, to, deltaCm });

    if (from === null || deltaCm === null) continue;

    const absDelta = Math.abs(deltaCm);
    const threshold = THRESHOLDS[field] ?? 2;

    if (absDelta >= threshold) {
      alerts.push({
        field,
        from,
        to,
        deltaCm,
        severity: absDelta >= threshold * 1.5 ? "warning" : "watch",
        message:
          absDelta >= threshold * 1.5
            ? `${field} shifted ${absDelta} cm (${from} → ${to}) — verify before next cut`
            : `${field} changed ${absDelta} cm (${from} → ${to}) — review fit notes`,
      });
    }
  }

  return { deltas, alerts };
}

export function computeFitConfidence(input: {
  alertCount: number;
  hasOutcome: boolean;
  fitSuccess?: boolean;
  remakeRequired?: boolean;
  fittingRoundCount: number;
  orderActive: boolean;
}): number {
  let score = 100;

  score -= input.alertCount * 12;

  if (input.hasOutcome) {
    if (input.remakeRequired) return 0;
    if (input.fitSuccess === false) score -= 45;
    if (input.fitSuccess === true) score = Math.min(100, score + 10);
  } else if (input.orderActive) {
    if (input.fittingRoundCount === 0) score -= 25;
    else if (input.fittingRoundCount === 1) score -= 10;
    score = Math.min(score, 85);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
