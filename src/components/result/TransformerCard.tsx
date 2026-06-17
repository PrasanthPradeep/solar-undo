import { Transformer } from "@/features/transformer/transformer.types";

interface Props {
  transformer: Transformer;
}

export default function TransformerCard({
  transformer,
}: Props) {
  return (
    <div className="rounded-2xl border p-6">
      <h2 className="text-xl font-semibold mb-4">
        Transformer Details
      </h2>

      <div className="space-y-2">
        <p>
          <strong>Name:</strong>{" "}
          {transformer.name}
        </p>

        <p>
          <strong>Office:</strong>{" "}
          {transformer.officeCode}
        </p>

        <p>
          <strong>Capacity:</strong>{" "}
          {transformer.capacity} kVA
        </p>
      </div>
    </div>
  );
}