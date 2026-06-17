"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEligibilityStore } from "@/store/eligibility-store";

class VerificationError extends Error {
  constructor(message: string, public readonly stage?: string) {
    super(message);
    this.name = "VerificationError";
  }
}

export default function CaptchaForm() {
  const router = useRouter();

  const setCaptcha = useEligibilityStore((state) => state.setCaptcha);
  const consumerNumber = useEligibilityStore((state) => state.consumerNumber);
  const mobileNumber = useEligibilityStore((state) => state.mobileNumber);
  const setConsumer = useEligibilityStore((state) => state.setConsumer);
  const setTransformer = useEligibilityStore((state) => state.setTransformer);

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaUniqueIdHidden, setCaptchaUniqueIdHidden] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRequestRef = useRef(0);
  const initialCaptchaLoadedRef = useRef(false);

  const loadCaptcha = useCallback(async (options?: { keepError?: boolean }) => {
    const requestId = captchaRequestRef.current + 1;
    captchaRequestRef.current = requestId;
    setCaptchaLoading(true);
    if (!options?.keepError) setError(null);
    setCaptchaCode("");

    try {
      const response = await fetch("/api/captcha", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load captcha");
      }

      if (requestId === captchaRequestRef.current) {
        setCaptchaUniqueIdHidden(result.data.captchaUniqueIdHidden);
        setCaptchaImage(`data:${result.data.contentType};base64,${result.data.imageBase64}`);
      }
    } catch (err: unknown) {
      if (requestId === captchaRequestRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load captcha");
        setCaptchaImage(null);
        setCaptchaUniqueIdHidden("");
      }
    } finally {
      if (requestId === captchaRequestRef.current) {
        setCaptchaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (initialCaptchaLoadedRef.current) return;
    initialCaptchaLoadedRef.current = true;
    void Promise.resolve().then(() => loadCaptcha());
  }, [loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaCode.trim()) {
      setError("Please enter the captcha code shown above");
      return;
    }

    if (!captchaUniqueIdHidden.trim()) {
      setError("Captcha session missing — please refresh the captcha");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumerNumber,
          phone: mobileNumber,
          captchaUniqueIdHidden,
          code: captchaCode,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new VerificationError(result.error || "Failed to verify consumer", result.stage);
      }

      setCaptcha(captchaUniqueIdHidden, captchaCode);
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
      });

      router.push("/result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify consumer";
      setError(message);

      const stage = err instanceof VerificationError ? err.stage : undefined;
      if (stage === "quickpay" || (!stage && /captcha|session/i.test(message))) {
        await loadCaptcha({ keepError: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || captchaLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Captcha image panel */}
      <div>
        <p className="text-sm font-medium mb-2 text-foreground">Captcha Challenge</p>
        <div
          className="rounded-xl border flex items-center justify-center overflow-hidden"
          style={{
            height: "72px",
            background: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          {captchaLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="spinner" />
              Loading captcha…
            </div>
          ) : captchaImage ? (
            <Image
              src={captchaImage}
              alt="KSEB captcha — type the characters shown"
              width={200}
              height={64}
              unoptimized
              className="h-14 w-auto object-contain"
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              Captcha unavailable
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
          style={{
            background: "var(--status-full-bg)",
            color: "var(--status-full)",
            border: "1px solid var(--status-full)",
          }}
          role="alert"
        >
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Captcha input */}
      <div className="space-y-1.5">
        <label htmlFor="captcha-code" className="block text-sm font-medium text-foreground">
          Enter Captcha
        </label>
        <input
          id="captcha-code"
          type="text"
          value={captchaCode}
          onChange={(e) => setCaptchaCode(e.target.value)}
          disabled={isDisabled}
          className="input-premium w-full rounded-xl px-4 py-3 text-sm font-mono tracking-widest disabled:opacity-50"
          placeholder="Type the characters above"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          id="refresh-captcha-btn"
          onClick={() => loadCaptcha()}
          disabled={isDisabled}
          className="flex-1 rounded-xl border py-3 text-sm font-medium transition-colors disabled:opacity-50 hover:bg-muted"
          style={{ borderColor: "var(--border)" }}
        >
          {captchaLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" />
              Refreshing…
            </span>
          ) : (
            "↻ Refresh Captcha"
          )}
        </button>

        <button
          id="verify-submit-btn"
          type="submit"
          disabled={isDisabled}
          className="flex-1 btn-solar rounded-xl py-3 text-sm font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" />
              Verifying…
            </span>
          ) : (
            "Verify & Check →"
          )}
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        This may take a few seconds while we retrieve your bill and transformer data
      </p>
    </form>
  );
}
