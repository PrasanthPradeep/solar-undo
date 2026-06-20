import React, { forwardRef } from "react";
import { SolarStatus } from "@/features/solar/solar.types";

interface ExportCardProps {
  consumerNo: string;
  sectionName: string;
  transformerName: string;
  feederName: string;
  availableKw: number;
  lastUpdated?: string;
  status?: SolarStatus;
  dtrCapacity?: number;
}

export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(
  (
    {
      consumerNo,
      sectionName,
      transformerName,
      feederName,
      availableKw,
      lastUpdated,
      status,
      dtrCapacity,
    },
    ref
  ) => {
    // Mask consumer number: keep first 3 and last 4 digits
    const maskedConsumer =
      consumerNo.length >= 7
        ? `${consumerNo.slice(0, 3)}*****${consumerNo.slice(-4)}`
        : consumerNo;

    const derivedStatus: SolarStatus =
      status ?? (availableKw > 10 ? "AVAILABLE" : availableKw > 0 ? "LIMITED" : "FULL");

    const statusConfig = {
      AVAILABLE: {
        label: "Capacity Available",
        color: "#047857", // Emerald-700
        bg: "rgba(16, 185, 129, 0.08)",
        glow: "0 4px 20px rgba(16, 185, 129, 0.12)",
      },
      LIMITED: {
        label: "Limited Capacity",
        color: "#b45309", // Amber-700
        bg: "rgba(245, 158, 11, 0.08)",
        glow: "0 4px 20px rgba(245, 158, 11, 0.12)",
      },
      FULL: {
        label: "Capacity Full",
        color: "#b91c1c", // Red-700
        bg: "rgba(239, 68, 68, 0.08)",
        glow: "0 4px 20px rgba(239, 68, 68, 0.12)",
      },
    }[derivedStatus];

    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#f8fafc",
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.07) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)
          `,
          color: "#0f172a",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div
              style={{
                fontSize: "38px",
                fontWeight: 900,
                letterSpacing: "-1px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ color: "#f59e0b" }}>☀️</span>
              <span
                style={{
                  background: "linear-gradient(to right, #f59e0b, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SOLAR UNDO
              </span>
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginTop: "8px",
              }}
            >
              Capacity Verification Report
            </div>
          </div>
          <div
            style={{
              padding: "10px 24px",
              borderRadius: "100px",
              backgroundColor: statusConfig.bg,
              border: `1.5px solid ${statusConfig.color}`,
              color: statusConfig.color,
              fontSize: "18px",
              fontWeight: 700,
              boxShadow: statusConfig.glow,
              letterSpacing: "0.5px",
            }}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Center Panel — Big Result */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "32px",
            padding: "60px",
            textAlign: "center",
            boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Remaining Solar Headroom
          </div>
          <div
            style={{
              fontSize: "100px",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-2px",
              lineHeight: 1,
              marginBottom: "12px",
            }}
          >
            {availableKw.toFixed(2)}{" "}
            <span style={{ fontSize: "40px", fontWeight: 700, color: statusConfig.color }}>
              kW
            </span>
          </div>
          <div style={{ fontSize: "16px", color: "#64748b" }}>
            Based on maximum hosting limit (81% of DTR Rating)
            {dtrCapacity ? ` — DTR Capacity: ${dtrCapacity} kVA` : ""}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {[
            { label: "Consumer Number", value: maskedConsumer, icon: "🔢" },
            { label: "Electrical Section", value: sectionName, icon: "🏢" },
            { label: "Transformer (DTR)", value: transformerName, icon: "⚡" },
            { label: "Feeder Line", value: feederName, icon: "🔌" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "120px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1e293b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.value || "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1.5px solid #e2e8f0",
            paddingTop: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Report Generated On</div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#334155", marginTop: "4px" }}>
              {lastUpdated
                ? new Date(lastUpdated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Verify online at</div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#b45309",
                marginTop: "4px",
                letterSpacing: "-0.5px",
              }}
            >
              solarundo.prasanthp.tech
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ExportCard.displayName = "ExportCard";
