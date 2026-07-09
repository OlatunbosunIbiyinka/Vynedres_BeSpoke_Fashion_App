/**
 * Analytics = data transformation layer.
 *
 * Flow this module sits in:
 *   creation (forms/API) → storage (PostgreSQL) → movement (Prisma queries)
 *   → transformation (this file) → consumption (assistant / UI)
 *
 * Never invent numbers. Every metric is computed from tenant-scoped rows.
 */

import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

const ACTIVE_STATUSES: OrderStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "FITTING",
  "READY",
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clientName(client: { firstName: string; lastName: string }): string {
  return `${client.firstName} ${client.lastName}`;
}

export type ProcessingTimeResult = {
  deliveredCount: number;
  averageDays: number | null;
  medianDays: number | null;
  minDays: number | null;
  maxDays: number | null;
  samples: Array<{
    orderNumber: string;
    clientName: string;
    days: number;
  }>;
};

export type DelayRiskLevel = "overdue" | "at_risk" | "watch";

export type DelayRiskOrder = {
  orderNumber: string;
  clientName: string;
  garmentType: string;
  status: OrderStatus;
  ageDays: number;
  riskLevel: DelayRiskLevel;
  reasons: string[];
  dueDate: string | null;
  collectionDate: string | null;
};

export type DelayRiskResult = {
  averageProcessingDays: number | null;
  atRiskCount: number;
  orders: DelayRiskOrder[];
};

export type PipelineSummary = {
  totalOrders: number;
  byStatus: Record<string, number>;
  activeCount: number;
  deliveredCount: number;
  cancelledCount: number;
};

async function loadOrders(tenantId: string) {
  return prisma.order.findMany({
    where: { tenantId },
    include: {
      client: { select: { firstName: true, lastName: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

function deliveredAt(
  order: Awaited<ReturnType<typeof loadOrders>>[number],
): Date | null {
  if (order.status !== "DELIVERED") return null;
  const historyHit = [...order.statusHistory]
    .reverse()
    .find((h) => h.status === "DELIVERED");
  return historyHit?.createdAt ?? order.updatedAt;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/** Average time from order date → delivered (completed orders only). */
export async function getAverageProcessingTime(
  tenantId: string,
): Promise<ProcessingTimeResult> {
  const orders = await loadOrders(tenantId);
  const samples: ProcessingTimeResult["samples"] = [];

  for (const order of orders) {
    const end = deliveredAt(order);
    if (!end) continue;
    const days = daysBetween(order.createdAt, end);
    if (days < 0) continue;
    samples.push({
      orderNumber: order.orderNumber,
      clientName: clientName(order.client),
      days: round1(days),
    });
  }

  const dayValues = samples.map((s) => s.days);
  const averageDays =
    dayValues.length > 0
      ? round1(dayValues.reduce((a, b) => a + b, 0) / dayValues.length)
      : null;

  return {
    deliveredCount: samples.length,
    averageDays,
    medianDays: median(dayValues) !== null ? round1(median(dayValues)!) : null,
    minDays: dayValues.length ? round1(Math.min(...dayValues)) : null,
    maxDays: dayValues.length ? round1(Math.max(...dayValues)) : null,
    samples: samples.sort((a, b) => b.days - a.days).slice(0, 10),
  };
}

/**
 * Orders likely delayed:
 * - past workshop completion date while still active
 * - past client pickup date while not delivered
 * - completion due within 3 days and still early in pipeline
 * - age already exceeds historical average processing time
 */
export async function getOrdersLikelyDelayed(
  tenantId: string,
): Promise<DelayRiskResult> {
  const orders = await loadOrders(tenantId);
  const processing = await getAverageProcessingTime(tenantId);
  const avg = processing.averageDays;
  const today = startOfTodayUtc();
  const atRisk: DelayRiskOrder[] = [];

  for (const order of orders) {
    if (!ACTIVE_STATUSES.includes(order.status)) continue;

    const reasons: string[] = [];
    let riskLevel: DelayRiskLevel = "watch";
    const ageDays = round1(daysBetween(order.createdAt, today));

    if (order.dueDate) {
      const due = new Date(order.dueDate);
      const dueDay = new Date(
        Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()),
      );
      const daysToDue = daysBetween(today, dueDay);

      if (daysToDue < 0 && order.status !== "READY") {
        reasons.push(
          `Workshop completion was ${Math.abs(Math.floor(daysToDue))} day(s) ago`,
        );
        riskLevel = "overdue";
      } else if (daysToDue <= 3 && ["NEW", "IN_PROGRESS"].includes(order.status)) {
        reasons.push(
          `Completion due in ${Math.max(0, Math.ceil(daysToDue))} day(s) but still ${order.status.replace("_", " ").toLowerCase()}`,
        );
        riskLevel = "at_risk";
      }
    }

    if (order.collectionDate) {
      const pickup = new Date(order.collectionDate);
      const pickupDay = new Date(
        Date.UTC(pickup.getUTCFullYear(), pickup.getUTCMonth(), pickup.getUTCDate()),
      );
      const daysToPickup = daysBetween(today, pickupDay);

      if (daysToPickup < 0) {
        reasons.push(
          `Client pickup was ${Math.abs(Math.floor(daysToPickup))} day(s) ago`,
        );
        riskLevel = "overdue";
      } else if (daysToPickup <= 2 && order.status !== "READY") {
        reasons.push(
          `Pickup in ${Math.ceil(daysToPickup)} day(s) but order is not ready`,
        );
        if (riskLevel === "watch") riskLevel = "at_risk";
      }
    }

    if (avg !== null && ageDays > avg * 1.25 && order.status !== "READY") {
      reasons.push(
        `Open for ${ageDays} days (studio average completion is ${avg} days)`,
      );
      if (riskLevel === "watch") riskLevel = "at_risk";
    }

    if (reasons.length === 0) continue;

    atRisk.push({
      orderNumber: order.orderNumber,
      clientName: clientName(order.client),
      garmentType: order.garmentType,
      status: order.status,
      ageDays,
      riskLevel,
      reasons,
      dueDate: order.dueDate?.toISOString() ?? null,
      collectionDate: order.collectionDate?.toISOString() ?? null,
    });
  }

  const rank: Record<DelayRiskLevel, number> = {
    overdue: 0,
    at_risk: 1,
    watch: 2,
  };

  atRisk.sort((a, b) => {
    const byRisk = rank[a.riskLevel] - rank[b.riskLevel];
    if (byRisk !== 0) return byRisk;
    return b.ageDays - a.ageDays;
  });

  return {
    averageProcessingDays: avg,
    atRiskCount: atRisk.length,
    orders: atRisk,
  };
}

export async function getPipelineSummary(
  tenantId: string,
): Promise<PipelineSummary> {
  const orders = await prisma.order.findMany({
    where: { tenantId },
    select: { status: true },
  });

  const byStatus: Record<string, number> = {};
  for (const status of Object.values(OrderStatus)) {
    byStatus[status] = 0;
  }
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
  }

  return {
    totalOrders: orders.length,
    byStatus,
    activeCount: ACTIVE_STATUSES.reduce((n, s) => n + (byStatus[s] ?? 0), 0),
    deliveredCount: byStatus.DELIVERED ?? 0,
    cancelledCount: byStatus.CANCELLED ?? 0,
  };
}
