"use client";

import { useEffect, useState } from "react";

interface CoverageStats {
  districtsIndexed: number;
  sectionsIndexed: number;
  transformersIndexed: number;
  available: boolean;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function CoverageStats() {
  const [stats, setStats] = useState<CoverageStats | null>(null);

  useEffect(() => {
    fetch("/api/coverage-stats")
      .then((res) => res.json())
      .then((data: CoverageStats) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  if (!stats?.available) return null;

  const items = [
    { label: "Districts Indexed", value: stats.districtsIndexed },
    { label: "Sections Indexed", value: stats.sectionsIndexed },
    { label: "Transformers Indexed", value: stats.transformersIndexed },
  ];

  return (
    <div className="glass-card w-full max-w-lg rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Solar Undo Coverage
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="stat-card p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-primary">{formatCount(item.value)}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
