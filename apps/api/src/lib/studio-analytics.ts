/**
 * Studio-level analytics — KPIs and chart data for the dashboard.
 * All metrics from tenant-scoped DB queries (no invented numbers).
 */

import { prisma } from "./prisma.js";
import {
  getAverageProcessingTime,
  getPipelineSummary,
} from "./analytics.js";
import { getFitSummaries, getOrdersWithFitRisk } from "./fit-graph.js";

export type StatusSegment = {
  status: string;
  label: string;
  count: number;
};

export type StudioInsights = {
  activeOrders: number;
  atFitRisk: number;
  averageProcessingDays: number | null;
  deliveredGoodFitPercent: number | null;
  deliveredWithOutcomeCount: number;
  ordersByStatus: StatusSegment[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  FITTING: "Fitting",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export async function getStudioInsights(tenantId: string): Promise<StudioInsights> {
  const [pipeline, fitRisk, processing, deliveredOrders] = await Promise.all([
    getPipelineSummary(tenantId),
    getOrdersWithFitRisk(tenantId),
    getAverageProcessingTime(tenantId),
    prisma.order.findMany({
      where: { tenantId, status: "DELIVERED" },
      include: { outcome: true },
    }),
  ]);

  const withOutcome = deliveredOrders.filter((o) => o.outcome);
  const goodFit = withOutcome.filter(
    (o) => o.outcome!.fitSuccess && !o.outcome!.remakeRequired,
  );
  const deliveredGoodFitPercent =
    withOutcome.length > 0
      ? Math.round((goodFit.length / withOutcome.length) * 100)
      : null;

  const ordersByStatus: StatusSegment[] = Object.entries(pipeline.byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] ?? status.replaceAll("_", " "),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    activeOrders: pipeline.activeCount,
    atFitRisk: fitRisk.lowConfidenceCount,
    averageProcessingDays: processing.averageDays,
    deliveredGoodFitPercent,
    deliveredWithOutcomeCount: withOutcome.length,
    ordersByStatus,
  };
}

/** Fit confidence buckets for active orders (optional chart data). */
export async function getFitConfidenceBuckets(tenantId: string) {
  const summaries = await getFitSummaries(tenantId);
  const active = await prisma.order.findMany({
    where: {
      tenantId,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    select: { id: true },
  });
  const activeIds = new Set(active.map((o) => o.id));

  let high = 0;
  let medium = 0;
  let low = 0;

  for (const s of summaries) {
    if (!activeIds.has(s.orderId)) continue;
    if (s.fitConfidence >= 80) high++;
    else if (s.fitConfidence >= 60) medium++;
    else low++;
  }

  return { high, medium, low };
}
