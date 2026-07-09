/**
 * Fit Graph — links baseline measurements → fitting rounds → delivery outcome.
 */

import { prisma } from "./prisma.js";
import {
  compareMeasurements,
  computeFitConfidence,
  type DeltaAlert,
  type FieldDelta,
  type MeasurementSnapshot,
} from "./fitting-delta.js";

export type FittingRoundView = {
  id: string;
  roundNumber: number;
  label: string;
  measurements: MeasurementSnapshot;
  alterations: string | null;
  notes: string | null;
  createdAt: string;
  deltasFromPrevious: FieldDelta[];
  alerts: DeltaAlert[];
};

export type FitGraph = {
  orderId: string;
  orderNumber: string;
  garmentType: string;
  status: string;
  clientName: string;
  baseline: {
    label: string;
    data: MeasurementSnapshot;
    createdAt: string;
    source: "client_profile" | "order_linked";
    submittedVia: "STUDIO" | "PORTAL";
  } | null;
  fittingRounds: FittingRoundView[];
  outcome: {
    fitSuccess: boolean;
    remakeRequired: boolean;
    notes: string | null;
    recordedAt: string;
  } | null;
  fitConfidence: number;
  totalAlerts: number;
};

export type FitRiskOrder = {
  orderId: string;
  orderNumber: string;
  clientName: string;
  garmentType: string;
  status: string;
  fitConfidence: number;
  alertCount: number;
  topAlert: string | null;
};

export type FitSummary = {
  orderId: string;
  fitConfidence: number;
  totalAlerts: number;
  fittingRoundCount: number;
  hasBaseline: boolean;
  hasOutcome: boolean;
  outcomeSuccess: boolean | null;
};

async function loadOrderGraph(orderId: string, tenantId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      client: { select: { firstName: true, lastName: true } },
      fittingRounds: { orderBy: { roundNumber: "asc" } },
      outcome: true,
      measurementProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

async function resolveBaseline(
  order: NonNullable<Awaited<ReturnType<typeof loadOrderGraph>>>,
): Promise<FitGraph["baseline"]> {
  const linked = order.measurementProfiles[0];
  if (linked) {
    return {
      label: linked.label,
      data: linked.data as MeasurementSnapshot,
      createdAt: linked.createdAt.toISOString(),
      source: "order_linked",
      submittedVia: linked.source,
    };
  }

  const clientProfile = await prisma.measurementProfile.findFirst({
    where: { clientId: order.clientId, tenantId: order.tenantId },
    orderBy: { createdAt: "asc" },
  });

  if (!clientProfile) return null;

  return {
    label: clientProfile.label,
    data: clientProfile.data as MeasurementSnapshot,
    createdAt: clientProfile.createdAt.toISOString(),
    source: "client_profile",
    submittedVia: clientProfile.source,
  };
}

export async function buildFitGraph(
  orderId: string,
  tenantId: string,
): Promise<FitGraph | null> {
  const order = await loadOrderGraph(orderId, tenantId);
  if (!order) return null;

  const baseline = await resolveBaseline(order);
  const fittingRounds: FittingRoundView[] = [];
  let previous: MeasurementSnapshot | null = baseline?.data ?? null;
  let totalAlerts = 0;

  for (const round of order.fittingRounds) {
    const current = round.measurements as MeasurementSnapshot;
    const { deltas, alerts } = compareMeasurements(previous, current);
    totalAlerts += alerts.length;

    fittingRounds.push({
      id: round.id,
      roundNumber: round.roundNumber,
      label: round.label,
      measurements: current,
      alterations: round.alterations,
      notes: round.notes,
      createdAt: round.createdAt.toISOString(),
      deltasFromPrevious: deltas,
      alerts,
    });

    previous = current;
  }

  const activeStatuses = ["NEW", "IN_PROGRESS", "FITTING", "READY"];
  const fitConfidence = computeFitConfidence({
    alertCount: totalAlerts,
    hasOutcome: !!order.outcome,
    fitSuccess: order.outcome?.fitSuccess,
    remakeRequired: order.outcome?.remakeRequired,
    fittingRoundCount: order.fittingRounds.length,
    orderActive: activeStatuses.includes(order.status),
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    garmentType: order.garmentType,
    status: order.status,
    clientName: `${order.client.firstName} ${order.client.lastName}`,
    baseline,
    fittingRounds,
    outcome: order.outcome
      ? {
          fitSuccess: order.outcome.fitSuccess,
          remakeRequired: order.outcome.remakeRequired,
          notes: order.outcome.notes,
          recordedAt: order.outcome.recordedAt.toISOString(),
        }
      : null,
    fitConfidence,
    totalAlerts,
  };
}

export async function getOrdersWithFitRisk(
  tenantId: string,
): Promise<{ orders: FitRiskOrder[]; lowConfidenceCount: number }> {
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    select: { id: true },
  });

  const atRisk: FitRiskOrder[] = [];

  for (const { id } of orders) {
    const graph = await buildFitGraph(id, tenantId);
    if (!graph) continue;

    if (graph.totalAlerts > 0 || graph.fitConfidence < 70) {
      const topAlert =
        graph.fittingRounds.flatMap((r) => r.alerts).sort((a, b) => {
          const rank = { warning: 0, watch: 1 };
          return rank[a.severity] - rank[b.severity];
        })[0]?.message ?? null;

      atRisk.push({
        orderId: graph.orderId,
        orderNumber: graph.orderNumber,
        clientName: graph.clientName,
        garmentType: graph.garmentType,
        status: graph.status,
        fitConfidence: graph.fitConfidence,
        alertCount: graph.totalAlerts,
        topAlert,
      });
    }
  }

  atRisk.sort((a, b) => a.fitConfidence - b.fitConfidence);

  return {
    orders: atRisk,
    lowConfidenceCount: atRisk.length,
  };
}

/** Lightweight fit scores for every order — used on the studio order list. */
export async function getFitSummaries(tenantId: string): Promise<FitSummary[]> {
  const orders = await prisma.order.findMany({
    where: { tenantId },
    select: { id: true },
    orderBy: [{ createdAt: "desc" }, { orderNumber: "desc" }],
  });

  const summaries: FitSummary[] = [];

  for (const { id } of orders) {
    const graph = await buildFitGraph(id, tenantId);
    if (!graph) continue;

    summaries.push({
      orderId: graph.orderId,
      fitConfidence: graph.fitConfidence,
      totalAlerts: graph.totalAlerts,
      fittingRoundCount: graph.fittingRounds.length,
      hasBaseline: !!graph.baseline,
      hasOutcome: !!graph.outcome,
      outcomeSuccess: graph.outcome?.fitSuccess ?? null,
    });
  }

  return summaries;
}
