import { Consumer } from "@/features/consumer/consumer.types";

interface Props {
  consumer: Consumer;
}

export default function ConsumerCard({
  consumer,
}: Props) {
  return (
    <div className="rounded-2xl border p-6">
      <h2 className="text-xl font-semibold mb-4">
        Consumer Details
      </h2>

      <div className="space-y-2">
        <p>
          <strong>Name:</strong>{" "}
          {consumer.consumerName}
        </p>

        <p>
          <strong>Consumer No:</strong>{" "}
          {consumer.consumerNumber}
        </p>

        <p>
          <strong>Section:</strong>{" "}
          {consumer.section}
        </p>

        <p>
          <strong>Tariff:</strong>{" "}
          {consumer.tariff}
        </p>
      </div>
    </div>
  );
}