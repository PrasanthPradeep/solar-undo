import { CapacityResponse } from "@/features/solar/solar.types";

interface Props {
  availableSolar: number;
}

export default function CapacityCard({
  availableSolar,
}: Props) {
  const status =
    availableSolar > 10
      ? "AVAILABLE"
      : availableSolar > 0
      ? "LIMITED"
      : "FULL";

  return (
    <div className="rounded-2xl border p-6">
      <h2 className="text-xl font-semibold mb-4">
        Solar Capacity
      </h2>

      <div className="space-y-3">
        <p className="text-4xl font-bold">
          {availableSolar} kW
        </p>

        <p>
          Status:
          <span className="ml-2 font-medium">
            {status}
          </span>
        </p>
      </div>
    </div>
  );
}
