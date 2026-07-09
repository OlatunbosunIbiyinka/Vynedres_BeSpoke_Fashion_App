"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusDonutChart } from "@/components/StatusDonutChart";
import { vynedresClientApi, type StudioInsights as StudioInsightsData } from "@/lib/api";

type StudioInsightsProps = {
  tenantSlug: string;
  refreshKey?: number;
};

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "gold" | "amber" | "emerald";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : "text-vynedres-golddeep";

  return (
    <div className="atelier-card-sm p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-vynedres-ink/50">{label}</p>
      <p className={`mt-1.5 font-display text-3xl font-light ${valueClass}`}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-vynedres-ink/45">{hint}</p>}
    </div>
  );
}

export function StudioInsights({ tenantSlug, refreshKey = 0 }: StudioInsightsProps) {
  const [data, setData] = useState<StudioInsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const insights = await vynedresClientApi.getStudioInsights(tenantSlug);
      setData(insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (error) {
    return <p className="mb-6 text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="mb-6 text-sm text-vynedres-ink/55">Loading studio insights…</p>;
  }

  const avgDays =
    data.averageProcessingDays != null ? `${data.averageProcessingDays}d` : "—";
  const goodFit =
    data.deliveredGoodFitPercent != null
      ? `${data.deliveredGoodFitPercent}%`
      : "—";
  const goodFitHint =
    data.deliveredWithOutcomeCount > 0
      ? `From ${data.deliveredWithOutcomeCount} delivered with outcome`
      : "Record delivery outcomes to track";

  return (
    <section className="atelier-card mb-8 overflow-hidden">
      <div className="rule-gold" />
      <div className="px-5 pb-5 pt-4">
      <div className="mb-4">
        <p className="eyebrow">Studio Insights</p>
        <h2 className="font-display text-xl font-light leading-tight text-vynedres-ink">
          At a glance
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active orders" value={String(data.activeOrders)} />
        <KpiCard
          label="At fit risk"
          value={String(data.atFitRisk)}
          accent={data.atFitRisk > 0 ? "amber" : undefined}
          hint="Low confidence or delta alerts"
        />
        <KpiCard
          label="Avg processing"
          value={avgDays}
          hint="Order date → delivered"
        />
        <KpiCard
          label="Good fit rate"
          value={goodFit}
          accent={data.deliveredGoodFitPercent != null ? "emerald" : undefined}
          hint={goodFitHint}
        />
      </div>

      <div className="mt-6 border-t border-vynedres-ink/10 pt-5">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-vynedres-ink/50">
          Orders by status
        </p>
        <StatusDonutChart segments={data.ordersByStatus} />
      </div>
      </div>
    </section>
  );
}
