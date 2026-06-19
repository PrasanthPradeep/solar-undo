interface CapacityTrendChartProps {
  points?: Array<{ date: string; availableKw: number }>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00`)
  );
}

export default function CapacityTrendChart({ points = [] }: CapacityTrendChartProps) {
  if (points.length < 2) return null;

  const values = points.map((point) => point.availableKw);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const chartPoints = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 88 - ((point.availableKw - min) / range) * 72;
    return { ...point, x, y };
  });
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Past 7 Days</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {min} - {max} kW
        </p>
      </div>

      <div className="h-44 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <line x1="0" y1="88" x2="100" y2="88" stroke="var(--border)" strokeWidth="1" />
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chartPoints.map((point) => (
            <circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="1.8"
              fill="white"
              stroke="var(--primary)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {points.map((point) => (
          <div key={point.date} className="min-w-0 text-center">
            <p className="truncate text-[10px] text-muted-foreground">{formatDate(point.date)}</p>
            <p className="text-[11px] font-semibold tabular-nums">{point.availableKw}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
