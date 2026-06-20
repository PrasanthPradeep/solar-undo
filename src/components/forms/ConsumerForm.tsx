"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEligibilityStore } from "@/store/eligibility-store";
import { INPUT_LIMITS } from "@/constants/limits";
import { trackEvent } from "@/lib/analytics";

export default function ConsumerForm() {
  const router = useRouter();
  const setConsumerDetails = useEligibilityStore((state) => state.setConsumerDetails);
  const setConsumer = useEligibilityStore((state) => state.setConsumer);
  const setTransformer = useEligibilityStore((state) => state.setTransformer);

  const [consumerNumber, setConsumerNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errors, setErrors] = useState<{ consumerNumber?: string; mobileNumber?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (options?: { requireMobile?: boolean }) => {
    const next: typeof errors = {};
    if (consumerNumber.length !== INPUT_LIMITS.CONSUMER_NUMBER_LENGTH) {
      next.consumerNumber = `Consumer number must be exactly ${INPUT_LIMITS.CONSUMER_NUMBER_LENGTH} digits`;
    }
    if (options?.requireMobile && mobileNumber.length !== INPUT_LIMITS.MOBILE_NUMBER_LENGTH) {
      next.mobileNumber = `Mobile number must be exactly ${INPUT_LIMITS.MOBILE_NUMBER_LENGTH} digits`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ requireMobile: true })) return;
    trackEvent("consumer_details_submitted");
    setConsumerDetails(consumerNumber, mobileNumber);
    setLoading(true);

    try {
      const response = await fetch("/api/consumer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumerNumber, mobile: mobileNumber }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        trackEvent("consumer_cache_hit", {
          section_name: result.data.sectionName,
          transformer_name: result.data.transformerName,
        });
        setConsumer({
          consumerNumber: result.data.consumerNumber,
          consumerName: result.data.consumerName,
          mobile: mobileNumber,
          section: result.data.sectionName,
          tariff: result.data.tariff,
          billNo: result.data.billNo,
          dtr: result.data.transformerName,
          officeCode: result.data.officeCode,
          office_phone: result.data.office_phone,
        });
        setTransformer({
          name: result.data.transformerName,
          feederName: result.data.feederName ?? "",
          dtrCapacity: result.data.dtrCapacity ?? 0,
          capacity: result.data.dtr90Capacity,
          availableSolar: result.data.balanceAvailable,
          availableSolarCapacity: result.data.balanceAvailable,
          officeCode: result.data.officeCode,
          feasibilityIssued: result.data.feasibilityIssued,
          registrations: result.data.registrations,
          gridConnected: result.data.gridConnected,
          solarAvailable: result.data.solarAvailable,
          status: result.data.status,
          asOn: result.data.asOn,
          source: result.data.source,
          history: result.data.history,
          capacityChange: result.data.capacityChange,
        });
        router.push("/result");
        return;
      }

      trackEvent("consumer_cache_miss");
      if (!validate({ requireMobile: true })) return;
      router.push("/verify");
    } catch {
      if (!validate({ requireMobile: true })) return;
      router.push("/verify");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Consumer Number */}
      <div className="space-y-1.5">
        <label htmlFor="consumer-number" className="block text-base font-medium text-foreground">
          Consumer Number
        </label>
        <input
          id="consumer-number"
          type="text"
          inputMode="numeric"
          value={consumerNumber}
          onChange={(e) => {
            setConsumerNumber(e.target.value.replace(/\D/g, ""));
            if (errors.consumerNumber) setErrors((p) => ({ ...p, consumerNumber: undefined }));
          }}
          maxLength={INPUT_LIMITS.CONSUMER_NUMBER_LENGTH}
          className="input-premium w-full rounded-xl px-4 py-3.5 text-base"
          placeholder="e.g. 114 xxx xxx xx16"
          aria-describedby={errors.consumerNumber ? "cn-error" : undefined}
          aria-invalid={!!errors.consumerNumber}
        />
        {errors.consumerNumber && (
          <p id="cn-error" className="text-xs" style={{ color: "var(--status-full)" }} role="alert">
            {errors.consumerNumber}
          </p>
        )}
        {/* Progress indicator */}
        {consumerNumber.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(consumerNumber.length / INPUT_LIMITS.CONSUMER_NUMBER_LENGTH) * 100}%`,
                  background: consumerNumber.length === INPUT_LIMITS.CONSUMER_NUMBER_LENGTH
                    ? "var(--status-available)"
                    : "var(--primary)",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {consumerNumber.length}/{INPUT_LIMITS.CONSUMER_NUMBER_LENGTH}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Number */}
      <div className="space-y-1.5">
        <label htmlFor="mobile-number" className="block text-base font-medium text-foreground">
          Registered Mobile Number
        </label>
        <input
          id="mobile-number"
          type="tel"
          inputMode="numeric"
          value={mobileNumber}
          onChange={(e) => {
            setMobileNumber(e.target.value.replace(/\D/g, ""));
            if (errors.mobileNumber) setErrors((p) => ({ ...p, mobileNumber: undefined }));
          }}
          maxLength={INPUT_LIMITS.MOBILE_NUMBER_LENGTH}
          className="input-premium w-full rounded-xl px-4 py-3.5 text-base"
          placeholder="e.g. 984 xxx xxxx"
          aria-describedby={errors.mobileNumber ? "mob-error" : undefined}
          aria-invalid={!!errors.mobileNumber}
        />
        {errors.mobileNumber && (
          <p id="mob-error" className="text-xs" style={{ color: "var(--status-full)" }} role="alert">
            {errors.mobileNumber}
          </p>
        )}
      </div>

      <button
        id="check-eligibility-btn"
        type="submit"
        disabled={loading}
        className="btn-solar w-full rounded-xl py-3.5 text-base font-semibold"
      >
        {loading ? "Checking cache..." : "Continue"}
      </button>
    </form>
  );
}
