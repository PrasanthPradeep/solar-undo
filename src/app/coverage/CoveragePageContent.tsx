"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Globe, MapPin } from "lucide-react";
import AppLogo from "@/components/common/AppLogo";
import Footer from "@/components/common/Footer";

interface CoverageStats {
  districtsIndexed: number;
  sectionsIndexed: number;
  transformersIndexed: number;
  available: boolean;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function CoveragePageContent() {
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coverage-stats")
      .then((res) => res.json())
      .then((data: CoverageStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(null);
        setLoading(false);
      });
  }, []);

  return (
    <main className="solar-gradient flex min-h-svh flex-col items-center px-5 pt-8 sm:pt-10">
      {/* Header */}
      <div className="w-full max-w-lg mb-6 text-center">
        <AppLogo size="md" className="mb-4" />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Database <span style={{ color: "var(--primary)" }}>Coverage</span>
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Real-time statistics of KSEB transformer and capacity data cached in our local database.
        </p>
      </div>

      {/* Main Card */}
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="spinner text-primary" />
            <p className="text-sm text-muted-foreground">Loading database stats...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Current Index Status
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Districts */}
              <div className="stat-card p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/40 rounded-xl mb-3 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCount(stats.districtsIndexed)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Districts</p>
              </div>

              {/* Sections */}
              <div className="stat-card p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl mb-3 text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCount(stats.sectionsIndexed)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Electrical Sections</p>
              </div>

              {/* Transformers */}
              <div className="stat-card p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-xl mb-3 text-blue-600 dark:text-blue-400">
                  <Database className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCount(stats.transformersIndexed)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Transformers (DTR)</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground space-y-2">
              <p>
                💡 <strong>How it works:</strong> When a consumer verifies their connection for the first time, their transformer mapping is cached. This allows subsequent lookups for the same area to bypass KSEB login screens entirely.
              </p>
              <p>
                🔄 <strong>Sync cycle:</strong> Caching is refreshed automatically using daily and monthly cron tasks to keep capacity limits accurate and up to date.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Failed to load database stats. Please check your connection or try again later.
          </div>
        )}
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium btn-solar transition-transform hover:scale-[1.02] text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mt-auto w-full pt-8">
        <Footer />
      </div>
    </main>
  );
}
