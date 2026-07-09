import { MEASUREMENT_FIELDS } from "@/lib/measurements";

type Delta = {
  field: string;
  from: number | null;
  to: number;
  deltaCm: number | null;
};

type MeasurementDeltaBarsProps = {
  title: string;
  deltas: Delta[];
  maxAbsCm?: number;
};

function barColor(deltaCm: number): string {
  const abs = Math.abs(deltaCm);
  if (abs >= 4) return "bg-red-500";
  if (abs >= 2) return "bg-amber-400";
  return "bg-vynedres-gold/70";
}

export function MeasurementDeltaBars({
  title,
  deltas,
  maxAbsCm = 5,
}: MeasurementDeltaBarsProps) {
  const withDelta = deltas.filter((d) => d.deltaCm != null);
  if (withDelta.length === 0) return null;

  const labelByKey = Object.fromEntries(
    MEASUREMENT_FIELDS.map((f) => [f.key, f.label]),
  );

  return (
    <div className="mt-3 rounded-lg border border-vynedres-ink/10 bg-vynedres-ink/[0.03] p-3">
      <p className="mb-3 text-xs uppercase tracking-wide text-vynedres-ink/50">{title}</p>
      <ul className="space-y-2">
        {withDelta.map((d) => {
          const delta = d.deltaCm!;
          const width = Math.min(100, (Math.abs(delta) / maxAbsCm) * 100);
          const isPositive = delta > 0;

          return (
            <li key={d.field}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-vynedres-ink/65">{labelByKey[d.field] ?? d.field}</span>
                <span className={Math.abs(delta) >= 2 ? "text-amber-600" : "text-vynedres-ink/55"}>
                  {delta > 0 ? "+" : ""}
                  {delta} cm
                  {d.from != null && (
                    <span className="text-vynedres-ink/45"> ({d.from} → {d.to})</span>
                  )}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-vynedres-ink/[0.06]">
                <div
                  className={`absolute top-0 h-full rounded-full ${barColor(delta)}`}
                  style={{
                    width: `${width}%`,
                    left: isPositive ? "50%" : `${50 - width}%`,
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/25" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
