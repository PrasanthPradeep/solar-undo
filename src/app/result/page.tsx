"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useEligibilityStore } from "@/store/eligibility-store";
import TransformerCard from "@/components/result/TransformerCard";
import CapacityCard from "@/components/result/CapacityCard";

export default function ResultPage() {
  const router = useRouter();

  const consumer =
    useEligibilityStore(
      (state) => state.consumer
    );

  const transformer =
    useEligibilityStore(
      (state) => state.transformer
    );

  useEffect(() => {
    if (!consumer || !transformer) {
      router.replace("/");
    }
  }, [consumer, router]);

  if (!consumer || !transformer) return null;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border p-6">
        <h1 className="text-3xl font-bold mb-6">
          Consumer Details
        </h1>

        <div className="space-y-4">
          <p>
            <strong>Name:</strong>{" "}
            {consumer.consumerName}
          </p>

          <p>
            <strong>Consumer Number:</strong>{" "}
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

          <p>
            <strong>Transformer:</strong>{" "}
            {consumer.dtr}
          </p>
        </div>
      </div>

      <TransformerCard transformer={transformer} />

      <CapacityCard
        availableSolar={transformer.availableSolar}
      />
    </main>
  );
}