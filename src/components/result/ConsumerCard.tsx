import { Consumer } from "@/features/consumer/consumer.types";

interface Props {
  consumer: Consumer;
}

export default function ConsumerCard({ consumer }: Props) {
  const fields = [
    { label: "Consumer Name", value: consumer.consumerName || "—" },
    { label: "Consumer No.", value: consumer.consumerNumber || "—", mono: true },
    { label: "Section", value: consumer.section || "—" },
    { label: "Tariff", value: consumer.tariff || "—" },
    { label: "Bill No.", value: consumer.billNo || "—", mono: true },
    { label: "Office Phone", value: consumer.office_phone || "—", mono: true },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: "var(--secondary)" }}
        >
          👤
        </div>
        <h2 className="text-base font-semibold text-foreground">Consumer Details</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fields.map(({ label, value, mono }) => (
          <div key={label} className="stat-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-sm font-semibold break-all ${mono ? "font-mono tracking-tight" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
