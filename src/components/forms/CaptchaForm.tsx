"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTransformer } from "@/features/transformer/transformer.service";
import { useEligibilityStore } from "@/store/eligibility-store";

export default function CaptchaForm() {
  const router = useRouter();

  const setCaptcha = useEligibilityStore((state) => state.setCaptcha);

  const [captchaCode, setCaptchaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consumerNumber = useEligibilityStore((state) => state.consumerNumber);
  const mobileNumber = useEligibilityStore((state) => state.mobileNumber);
  const setConsumer = useEligibilityStore((state) => state.setConsumer);
  const setTransformer = useEligibilityStore((state) => state.setTransformer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaCode.trim()) {
      setError("Please enter captcha code");
      return;
    }

    // A real app would verify the captcha code first.
    // For this mock flow, let's assume if it is entered, it's correct.
    setLoading(true);
    setError(null);

    try {
      const { verifyConsumer } = await import("@/features/consumer/consumer.service");
      const consumer = await verifyConsumer(consumerNumber, mobileNumber);

      setCaptcha("mock-captcha-12345", captchaCode);
      setConsumer(consumer);

      const transformer = await getTransformer(consumer.dtr);
      setTransformer(transformer);

      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Failed to verify consumer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* TODO: Replace with real captcha UI */}
      <div className="rounded-lg border bg-muted p-6 text-center text-muted-foreground">
        Captcha Image Preview
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium">
          Enter Captcha
        </label>

        <input
          type="text"
          value={captchaCode}
          onChange={(e) => setCaptchaCode(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border p-3 disabled:opacity-50"
          placeholder="Type captcha shown above"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black text-white py-3 disabled:opacity-50 hover:bg-neutral-800 transition-colors"
      >
        {loading ? "Verifying..." : "Verify & Get Capacity"}
      </button>
    </form>
  );
}
