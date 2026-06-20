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
        color: "var(--status-available)",
        bg: "var(--status-available-bg)",
        glow: "0 10px 30px var(--status-available-glow)",
      },
      LIMITED: {
        label: "Limited Capacity",
        color: "var(--status-limited)",
        bg: "var(--status-limited-bg)",
        glow: "0 10px 30px var(--status-limited-glow)",
      },
      FULL: {
        label: "Capacity Full",
        color: "var(--status-full)",
        bg: "var(--status-full-bg)",
        glow: "0 10px 30px var(--status-full-glow)",
      },
    }[derivedStatus];

    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "var(--background)",
          backgroundImage: `
            radial-gradient(ellipse 120% 60% at 50% -10%, color-mix(in oklch, var(--primary) 15%, transparent) 0%, transparent 70%),
            radial-gradient(circle at 80% 20%, color-mix(in oklch, var(--primary) 4%, transparent) 0%, transparent 50%)
          `,
          color: "var(--foreground)",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          border: "1px solid var(--border)",
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
            opacity: 0.05,
            backgroundImage: "radial-gradient(var(--foreground) 1px, transparent 1px)",
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
              <span style={{ color: "var(--primary)" }}>☀️</span>
              <span
                style={{
                  background: "linear-gradient(to right, var(--primary), #ef4444)",
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
                color: "var(--muted-foreground)",
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

        {/* Center Panel — Big Result styled like CapacityCard's hero */}
        <div
          style={{
            background: statusConfig.bg,
            border: `1.5px solid ${statusConfig.color}`,
            borderRadius: "32px",
            padding: "60px",
            textAlign: "center",
            boxShadow: statusConfig.glow,
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: statusConfig.color,
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
              color: statusConfig.color,
              letterSpacing: "-2px",
              lineHeight: 1,
              marginBottom: "12px",
            }}
          >
            {availableKw.toFixed(2)}{" "}
            <span style={{ fontSize: "40px", fontWeight: 700 }}>
              kW
            </span>
          </div>
          <div style={{ fontSize: "16px", color: statusConfig.color, opacity: 0.85, fontWeight: 500 }}>
            Based on maximum hosting limit (81% of DTR Rating)
            {dtrCapacity ? ` — DTR Capacity: ${dtrCapacity} kVA` : ""}
          </div>
        </div>

        {/* Details Grid styled like the app's stat cards */}
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
                background: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "120px",
                boxShadow: "0 4px 6px -1px oklch(0 0 0 / 2%)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
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
                  color: "var(--foreground)",
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
            borderTop: "1.5px solid var(--border)",
            paddingTop: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
              Report Generated On
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginTop: "4px",
              }}
            >
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
            <div style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
              Verify online at
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--primary)",
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
