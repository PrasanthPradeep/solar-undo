"use client";

import AppLogo from "@/components/common/AppLogo";
import CaptchaForm from "@/components/forms/CaptchaForm";
import { useEligibilityStore } from "@/store/eligibility-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyPage() {
  const router = useRouter();
  const consumerNumber = useEligibilityStore((state) => state.consumerNumber);
  const mobileNumber = useEligibilityStore((state) => state.mobileNumber);

  useEffect(() => {
    if (!consumerNumber || !mobileNumber) {
      router.replace("/");
    }
  }, [consumerNumber, mobileNumber, router]);

  if (!consumerNumber || !mobileNumber) return null;

  return (
    <main className="solar-gradient min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-md mb-6 text-center">
        <AppLogo size="sm" className="mb-5" />
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Verify Identity</h1>
        <p className="text-muted-foreground text-sm">
          Solve the KSEB captcha to confirm your details
        </p>
      </div>

      {/* Step indicator */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-center gap-0">
          <div className="flex flex-col items-center">
            <div className="step-dot done">✓</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Details</p>
          </div>
          <div className="h-px w-12 mb-5" style={{ background: "var(--status-available)" }} />
          <div className="flex flex-col items-center">
            <div className="step-dot active">2</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Verify</p>
          </div>
          <div className="h-px w-12 bg-border mb-5" />
          <div className="flex flex-col items-center">
            <div className="step-dot pending">3</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Result</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="glass-card w-full max-w-md rounded-2xl p-7 space-y-6">
        {/* Consumer info summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Consumer Number</p>
            <p className="text-sm font-semibold font-mono tracking-tight">
              {consumerNumber}
            </p>
          </div>
          <div className="stat-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Mobile Number</p>
            <p className="text-sm font-semibold font-mono tracking-tight">
              {mobileNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}
            </p>
          </div>
        </div>

        <hr className="border-border" />

        <CaptchaForm />
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Change consumer details
      </button>
    </main>
  );
}
