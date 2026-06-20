"use client";

import React, { useRef, useState } from "react";
import { useEligibilityStore } from "@/store/eligibility-store";
import { downloadExportCard } from "@/lib/download-image";
import { ExportCard } from "./ExportCard";

export default function DownloadButton() {
  const consumer = useEligibilityStore((state) => state.consumer);
  const transformer = useEligibilityStore((state) => state.transformer);

  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!consumer || !transformer) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    setError(null);

    try {
      await downloadExportCard(cardRef.current, "solar-undo-result.png");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download image.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {error && (
          <div
            className="mb-3 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            style={{
              background: "var(--status-full-bg)",
              color: "var(--status-full)",
              border: "1px solid var(--status-full)",
            }}
            role="alert"
          >
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full btn-solar rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="spinner" />
              <span>Generating PNG...</span>
            </>
          ) : (
            <>
              <span>📸</span>
              <span>Download PNG Result</span>
            </>
          )}
        </button>
      </div>

      {/* Off-screen render of the card for screenshot capturing */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        <ExportCard
          ref={cardRef}
          consumerNo={consumer.consumerNumber}
          sectionName={consumer.section}
          transformerName={transformer.name}
          feederName={transformer.feederName ?? ""}
          availableKw={transformer.availableSolar}
          lastUpdated={transformer.asOn}
          status={transformer.status}
          dtrCapacity={transformer.dtrCapacity}
        />
      </div>
    </>
  );
}
