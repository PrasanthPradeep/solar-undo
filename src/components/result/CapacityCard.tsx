import Image, { type StaticImageData } from "next/image";

import { SolarStatus } from "@/features/solar/solar.types";
import availableStatus from "@/components/available.gif";
import fullStatus from "@/components/Full.gif";
import limitedStatus from "@/components/limited.gif";

interface Props {
  availableSolar: number;
  status?: SolarStatus;
  dtr90Capacity?: number;
  feasibilityIssued?: number;
  registrations?: number;
  gridConnected?: number;
}

const STATUS_CONFIG: Record<
  SolarStatus,
  {
    label: string;
    description: string;
    image: StaticImageData;
    className: string;
    glowVar: string;
  }
> = {
  AVAILABLE: {
    label: "Available",
    description: "Good news! Your transformer has solar capacity available.",
    image: availableStatus,
    className: "status-available",
    glowVar: "var(--status-available-glow)",
  },
  LIMITED: {
    label: "Limited",
    description: "Only a small amount of solar capacity remains.",
    image: limitedStatus,
    className: "status-limited",
    glowVar: "var(--status-limited-glow)",
  },
  FULL: {
    label: "Full",
    description: "This transformer has reached its solar hosting capacity.",
    image: fullStatus,
    className: "status-full",
    glowVar: "var(--status-full-glow)",
  },
};

export default function CapacityCard({
  availableSolar,
  status,
  dtr90Capacity,
  feasibilityIssued,
  registrations,
  gridConnected,
}: Props) {
  const derivedStatus: SolarStatus =
    status ?? (availableSolar > 10 ? "AVAILABLE" : availableSolar > 0 ? "LIMITED" : "FULL");

  const config = STATUS_CONFIG[derivedStatus];

  const statRows = [
    { label: "Allowed Capacity (81%)", value: dtr90Capacity != null ? `${dtr90Capacity} kW` : "—" },
    { label: "Feasibility Issued", value: feasibilityIssued != null ? `${feasibilityIssued} kW` : "—" },
    { label: "Registrations", value: registrations != null ? `${registrations} kW` : "—" },
    { label: "Grid Connected", value: gridConnected != null ? `${gridConnected} kW` : "—" },
    {
      label: "Balance Available",
      value: `${availableSolar} kW`,
      highlight: true,
    },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Status hero */}
      <div
        className={`${config.className} animate-pulse-glow p-8 text-center`}
        style={{ "--glow-color": config.glowVar } as React.CSSProperties}
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-white/70">
          <Image
            src={config.image}
            alt={`${config.label} solar capacity`}
            width={64}
            height={64}
            unoptimized
            className="h-full w-full object-contain"
          />
        </div>
        <p className="text-3xl font-extrabold tracking-tight mb-1 animate-count">
          {availableSolar} kW
        </p>
        <p className="text-lg font-semibold mb-2">Solar Capacity {config.label}</p>
        <p className="text-sm opacity-80 max-w-xs mx-auto">{config.description}</p>

        {derivedStatus === "AVAILABLE" && (
          <a
            href="https://ekiran.kseb.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-700 shadow-sm ring-1 ring-orange-200 transition-colors hover:bg-orange-50"
          >
            Apply on KSEB e-Kiran
          </a>
        )}
      </div>

      {/* RES stats grid */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          RES DTR Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {statRows.map(({ label, value, highlight }) => (
            <div
              key={label}
              className="stat-card p-3"
              style={
                highlight
                  ? {
                    borderColor: "var(--primary)",
                    background: "var(--secondary)",
                  }
                  : undefined
              }
            >
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p
                className={`text-sm font-bold tabular-nums ${highlight ? "text-primary" : ""
                  }`}
                style={highlight ? { color: "var(--primary)" } : undefined}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
