import Link from "next/link";
import AppLogo from "@/components/common/AppLogo";
import Footer from "@/components/common/Footer";

export default function TermsPage() {
  return (
    <main className="solar-gradient flex min-h-screen flex-col items-center px-5 pt-8 sm:pt-10">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <AppLogo size="sm" className="mx-auto mb-4" />
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Use</h1>
        <p className="text-muted-foreground text-sm">
          Please read these terms carefully before using Solar ഉണ്ടോ?
        </p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6 mb-12">
        <div className="glass-card rounded-2xl p-7 space-y-6">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">🔌 1. Independent Utility Disclaimer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Solar ഉണ്ടോ?</strong> (solarundo.prasanthp.tech) is an independent, community-driven web utility
              designed for public convenience. This application is <strong>not affiliated with, authorized by, endorsed by, or in
              any way officially connected to</strong> the Kerala State Electricity Board (KSEB) or any of its subsidiaries.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">📊 2. Information Accuracy & "As-Is" Data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All information, capacity metrics, Feasibility limits, and status indications are provided strictly on an
              <strong> "as-is" and "as-available" basis</strong>. While we strive to maintain accurate caches, KSEB transformer capacities
              and bookings are subject to rapid, real-time changes. We make no warranties, expressed or implied, regarding the
              completeness, reliability, or accuracy of the data displayed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">🔍 3. Mandatory Official Verification</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users are strongly advised to verify critical solar slot capacity, booking eligibility, and transformer status
              directly via official KSEB channels or by consulting their local KSEB electrical section office prior to making financial
              commitments or initiating solar installations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">⚙️ 4. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Under no circumstances shall Solar ഉണ്ടോ? or its creators be held liable for any direct, indirect, incidental, or
              consequential losses or damages resulting from the use of, or inability to use, this application, or from relying
              on any capacity information presented herein.
            </p>
          </section>
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
