"use client";

import { useState } from "react";
import Link from "next/link";
import AppLogo from "@/components/common/AppLogo";
import Footer from "@/components/common/Footer";
import { INPUT_LIMITS } from "@/constants/limits";

export default function PrivacyPage() {
  const [consumerNumber, setConsumerNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (consumerNumber.length !== INPUT_LIMITS.CONSUMER_NUMBER_LENGTH) {
      setMessage({
        type: "error",
        text: `Consumer number must be exactly ${INPUT_LIMITS.CONSUMER_NUMBER_LENGTH} digits.`,
      });
      return;
    }
    if (mobileNumber.length !== INPUT_LIMITS.MOBILE_NUMBER_LENGTH) {
      setMessage({
        type: "error",
        text: `Mobile number must be exactly ${INPUT_LIMITS.MOBILE_NUMBER_LENGTH} digits.`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/privacy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumerNumber, mobileNumber }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({
          type: "success",
          text: result.message || "Your mapping has been deleted successfully.",
        });
        setConsumerNumber("");
        setMobileNumber("");
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to delete details. Please check your inputs.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="solar-gradient flex min-h-screen flex-col items-center px-5 pt-8 sm:pt-10">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <AppLogo size="sm" className="mx-auto mb-4" />
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">
          How we handle and respect your data at Solar ഉണ്ടോ?
        </p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6 mb-12">
        {/* Policy Details */}
        <div className="glass-card rounded-2xl p-7 space-y-6">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              🔒 1. Zero Personal Data Storage
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We care deeply about your privacy. Solar ഉണ്ടോ? does not store your name, full address, email,
              or payment details. Your registered mobile number is immediately converted into a secure cryptographic
              one-way hash (SHA-256) and is never saved in plain text.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              📊 2. Data Collected & Purpose
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              To provide fast checks without hitting KSEB servers repeatedly or prompting for captcha verification, we cache:
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Consumer Number:</strong> Used to map your household connection.</li>
                <li><strong>Hashed Mobile Number:</strong> Used solely to authenticate your subsequent check requests.</li>
                <li><strong>Transformer Information:</strong> Name, section, and rooftop capacity metrics.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              ⏳ 3. Automated Retention
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Any cached mapping is automatically purged from our database after <strong>180 days of inactivity</strong>.
              If you do not check your solar slot capacity within this period, all cached records relating to your connection
              will be permanently deleted.
            </p>
          </section>
        </div>

        {/* Interactive Deletion Form */}
        <div className="glass-card rounded-2xl p-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">🗑️ Request Instant Data Deletion</h2>
            <p className="text-xs text-muted-foreground">
              Want to wipe your cached mapping immediately? Enter your consumer number and registered mobile number below to delete all matching records.
            </p>
          </div>

          <form onSubmit={handleDelete} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Consumer Number */}
              <div className="space-y-1.5">
                <label htmlFor="delete-consumer-number" className="block text-xs font-medium text-foreground">
                  Consumer Number
                </label>
                <input
                  id="delete-consumer-number"
                  type="text"
                  inputMode="numeric"
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value.replace(/\D/g, ""))}
                  maxLength={INPUT_LIMITS.CONSUMER_NUMBER_LENGTH}
                  className="input-premium w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="13-digit consumer number"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label htmlFor="delete-mobile-number" className="block text-xs font-medium text-foreground">
                  Registered Mobile Number
                </label>
                <input
                  id="delete-mobile-number"
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  maxLength={INPUT_LIMITS.MOBILE_NUMBER_LENGTH}
                  className="input-premium w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-solar w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, oklch(0.54 0.22 27), oklch(0.45 0.2 20))", boxShadow: "none" }}
            >
              {loading ? "Deleting..." : "Delete My Data"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
            ← Return to Homepage
          </Link>
        </div>
      </div>

      <div className="mt-auto w-full pt-5">
        <Footer />
      </div>
    </main>
  );
}
