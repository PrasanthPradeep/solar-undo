"use client";

import CaptchaForm from "@/components/forms/CaptchaForm";
import { useEligibilityStore } from "@/store/eligibility-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyPage() {
  const router = useRouter();
  const consumerNumber =
    useEligibilityStore(
      (state) => state.consumerNumber
    );

  const mobileNumber =
    useEligibilityStore(
      (state) => state.mobileNumber
    );

  useEffect(() => {
    if (!consumerNumber || !mobileNumber) {
      router.replace("/");
    }
  }, [consumerNumber, mobileNumber, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6">
        <h1 className="text-2xl font-bold mb-6">
          Verify Consumer
        </h1>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Consumer Number
            </p>

            <p className="font-medium">
              {consumerNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Mobile Number
            </p>

            <p className="font-medium">
              {mobileNumber}
            </p>
          </div>
        </div>
        <CaptchaForm />
      </div>
    </main>
  );
}