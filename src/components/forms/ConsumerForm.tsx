"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEligibilityStore } from "@/store/eligibility-store";
import { INPUT_LIMITS } from "@/constants/limits";

export default function ConsumerForm() {
  const router = useRouter();
  const setConsumerDetails = useEligibilityStore((state) => state.setConsumerDetails);

  const [consumerNumber, setConsumerNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errors, setErrors] = useState<{ consumerNumber?: string; mobileNumber?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (consumerNumber.length !== INPUT_LIMITS.CONSUMER_NUMBER_LENGTH) {
      next.consumerNumber = `Consumer number must be exactly ${INPUT_LIMITS.CONSUMER_NUMBER_LENGTH} digits`;
    }
    if (mobileNumber.length !== INPUT_LIMITS.MOBILE_NUMBER_LENGTH) {
      next.mobileNumber = `Mobile number must be exactly ${INPUT_LIMITS.MOBILE_NUMBER_LENGTH} digits`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConsumerDetails(consumerNumber, mobileNumber);
    router.push("/verify");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Consumer Number */}
      <div className="space-y-1.5">
        <label htmlFor="consumer-number" className="block text-sm font-medium text-foreground">
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
          className="input-premium w-full rounded-xl px-4 py-3 text-sm"
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
        <label htmlFor="mobile-number" className="block text-sm font-medium text-foreground">
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
          className="input-premium w-full rounded-xl px-4 py-3 text-sm"
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
        className="btn-solar w-full rounded-xl py-3.5 text-sm font-semibold"
      >
        Continue to Verification →
      </button>
    </form>
  );
}