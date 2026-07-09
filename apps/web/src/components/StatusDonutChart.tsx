type Segment = {
  label: string;
  count: number;
  color: string;
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#94a3b8",
  IN_PROGRESS: "#c9a962",
  FITTING: "#38bdf8",
  READY: "#34d399",
  DELIVERED: "#10b981",
  CANCELLED: "#f87171",
};

type StatusDonutChartProps = {
  segments: Array<{ status: string; label: string; count: number }>;
};

export function StatusDonutChart({ segments }: StatusDonutChartProps) {
  const total = segments.reduce((n, s) => n + s.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-xs text-vynedres-ink/50">
        No orders yet
      </div>
    );
  }

  const enriched: Segment[] = segments.map((s) => ({
    label: s.label,
    count: s.count,
    color: STATUS_COLORS[s.status] ?? "#64748b",
  }));

  let cumulative = 0;
  const stops = enriched.map((s) => {
    const start = (cumulative / total) * 100;
    cumulative += s.count;
    const end = (cumulative / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });

  const gradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: gradient }}
        role="img"
        aria-label={`Orders by status, ${total} total`}
      >
        <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white">
          <span className="font-display text-lg text-vynedres-golddeep">{total}</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {enriched.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-vynedres-ink/75">{s.label}</span>
            <span className="text-vynedres-ink/50">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
