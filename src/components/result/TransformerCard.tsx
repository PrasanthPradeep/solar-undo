import { Transformer } from "@/features/transformer/transformer.types";

interface Props {
  transformer: Transformer;
}

export default function TransformerCard({ transformer }: Props) {
  const fields = [
    { icon: "⚡", label: "Transformer Name", value: transformer.name || "—" },
    { icon: "🔌", label: "Feeder", value: transformer.feederName || "—" },
    { icon: "🏢", label: "Office Code", value: transformer.officeCode || "—", mono: true },
    {
      icon: "📊",
      label: "DTR Rating",
      value: transformer.dtrCapacity ? `${transformer.dtrCapacity} kVA` : "—",
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: "var(--secondary)" }}
        >
          🔧
        </div>
        <h2 className="text-base font-semibold text-foreground">Transformer (DTR)</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ icon, label, value, mono }) => (
          <div key={label} className="stat-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">
              <span className="mr-1">{icon}</span>
              {label}
            </p>
            <p className={`text-sm font-semibold break-words ${mono ? "font-mono tracking-tight" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}