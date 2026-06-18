import Image, { type StaticImageData } from "next/image";
import { ArrowDown, ArrowRight, ArrowUp, Info } from "lucide-react";

import { SolarStatus } from "@/features/solar/solar.types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  capacityChange?: {
    deltaKw: number;
    previousKw: number;
    currentKw: number;
  } | null;
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
  capacityChange,
}: Props) {
  const derivedStatus: SolarStatus =
    status ?? (availableSolar > 10 ? "AVAILABLE" : availableSolar > 0 ? "LIMITED" : "FULL");

  const config = STATUS_CONFIG[derivedStatus];
  const changeLabel =
    !capacityChange || capacityChange.deltaKw === 0
      ? "No change"
      : `${capacityChange.deltaKw > 0 ? "+" : "-"}${Math.abs(capacityChange.deltaKw)} kW since yesterday`;
  const changeTone =
    !capacityChange || capacityChange.deltaKw === 0
      ? "var(--muted-foreground)"
      : capacityChange.deltaKw > 0
        ? "var(--status-available)"
        : "var(--status-full)";
  const ChangeIcon =
    !capacityChange || capacityChange.deltaKw === 0
      ? ArrowRight
      : capacityChange.deltaKw > 0
        ? ArrowUp
        : ArrowDown;

  const statRows = [
    {
      label: "Allowed Capacity (81%)",
      value: dtr90Capacity != null ? `${dtr90Capacity} kW` : "—",
      help: "Maximum rooftop solar capacity allowed on this transformer.",
    },
    {
      label: "Feasibility Issued",
      value: feasibilityIssued != null ? `${feasibilityIssued} kW` : "—",
      help: "Solar capacity already approved through feasibility certificates.",
    },
    {
      label: "Registrations",
      value: registrations != null ? `${registrations} kW` : "—",
      help: "Solar applications registered and counted against future capacity.",
    },
    {
      label: "Grid Connected",
      value: gridConnected != null ? `${gridConnected} kW` : "—",
      help: "Solar systems already commissioned and connected to the grid.",
    },
    {
      label: "Balance Available",
      value: `${availableSolar} kW`,
      help: "Remaining capacity available for new solar applications.",
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
        <div
          className="mx-auto mb-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-black/5"
          style={{ color: changeTone }}
        >
          <ChangeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{changeLabel}</span>
        </div>
        <p className="text-sm opacity-80 max-w-xs mx-auto">{config.description}</p>

        {derivedStatus === "AVAILABLE" && (
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href="https://ekiran.kseb.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-700 shadow-sm ring-1 ring-orange-200 transition-colors hover:bg-orange-50 sm:w-auto"
            >
              Apply on KSEB e-Kiran
            </a>
            <a
              href="https://pmsuryaghar.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-700 shadow-sm ring-1 ring-orange-200 transition-colors hover:bg-orange-50 sm:w-auto"
            >
              PM Surya Ghar
            </a>
          </div>
        )}
      </div>

      {/* RES stats grid */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          RES DTR Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {statRows.map(({ label, value, help, highlight }) => (
            <div
              key={label}
              className="stat-card relative min-h-20 p-3 pr-9"
              style={
                highlight
                  ? {
                    borderColor: "var(--primary)",
                    background: "var(--secondary)",
                  }
                  : undefined
              }
            >
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`About ${label}`}
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{help}</p>
                </PopoverContent>
              </Popover>

              <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
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
