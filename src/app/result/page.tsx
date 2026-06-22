"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import AppLogo from "@/components/common/AppLogo";
import Footer from "@/components/common/Footer";
import { useEligibilityStore } from "@/store/eligibility-store";
import ConsumerCard from "@/components/result/ConsumerCard";
import TransformerCard from "@/components/result/TransformerCard";
import CapacityCard from "@/components/result/CapacityCard";
import CapacityTrendChart from "@/components/result/CapacityTrendChart";
import DownloadButton from "@/components/result/DownloadButton";
import { formatAsOn } from "@/utils/formatters";
import { trackEvent } from "@/lib/analytics";

export default function ResultPage() {
  const router = useRouter();

  const consumer = useEligibilityStore((state) => state.consumer);
  const transformer = useEligibilityStore((state) => state.transformer);

  useEffect(() => {
    if (!consumer || !transformer) {
      router.replace("/");
      return;
    }

    trackEvent("result_shown", {
      section_name: consumer.section,
      transformer_name: transformer.name,
      balance_available: transformer.availableSolar,
      consumer_tariff: consumer.tariff,
      solar_status: transformer.status,
    });
  }, [consumer, transformer, router]);

  if (!consumer || !transformer) return null;

  return (
    <main className="solar-gradient min-h-screen py-10 px-4 pb-0">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center mb-8">
          <AppLogo size="sm" className="mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            Solar Capacity Result
          </h1>
          <p className="text-muted-foreground text-sm">
            Transformer-level solar availability for your KSEB connection
          </p>
          {transformer.asOn && (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              As on {formatAsOn(transformer.asOn)}
            </p>
          )}

          {/* Step indicator — all done */}
          <div className="flex items-center justify-center gap-0 mt-5">
            <div className="flex flex-col items-center">
              <div className="step-dot done">✓</div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">Details</p>
            </div>
            <div className="h-px w-12 mb-5" style={{ background: "var(--status-available)" }} />
            <div className="flex flex-col items-center">
              <div className="step-dot done">✓</div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">Verify</p>
            </div>
            <div className="h-px w-12 mb-5" style={{ background: "var(--status-available)" }} />
            <div className="flex flex-col items-center">
              <div className="step-dot active">3</div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">Result</p>
            </div>
          </div>
        </div>

        {/* Solar capacity card (primary CTA) */}
        <CapacityCard
          availableSolar={transformer.availableSolar}
          status={transformer.status}
          dtr90Capacity={transformer.capacity}
          feasibilityIssued={transformer.feasibilityIssued}
          registrations={transformer.registrations}
          gridConnected={transformer.gridConnected}
          capacityChange={transformer.capacityChange}
        />

        {/* Transformer info */}
        <TransformerCard transformer={transformer} />

        {/* Consumer info */}
        <ConsumerCard consumer={consumer} />

        <CapacityTrendChart points={transformer.history} />

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <DownloadButton />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="check-another-btn"
              onClick={() => {
                useEligibilityStore.getState().reset();
                router.push("/");
              }}
              className="flex-1 rounded-xl border py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
              style={{ borderColor: "var(--border)" }}
            >
              ☀️ Check Another Consumer
            </button>

            <a
              href="https://wss.kseb.in/selfservices/reCap"
              target="_blank"
              rel="noopener noreferrer"
              id="res-portal-link"
              className="flex-1 rounded-xl border py-3.5 text-sm font-medium text-center transition-colors hover:bg-muted"
              style={{ borderColor: "var(--border)" }}
            >
              View Full RES Data ↗
            </a>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-4">
          {transformer.source === "cache"
            ? "Data served from the Solar Undo capacity cache."
            : "Data sourced live from KSEB Renewable Energy Systems (RES) portal."}
        </p>
      </div>
      <div className="mt-8">
        <Footer />
      </div>
    </main>
  );
}
