import AppLogo from "@/components/common/AppLogo";
import FAQSection, { faqs } from "@/components/common/FAQSection";
import Footer from "@/components/common/Footer";
import ConsumerForm from "@/components/forms/ConsumerForm";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Solar ഉണ്ടോ?",
  applicationCategory: "UtilityApplication",
  description: "Check KSEB transformer-wise rooftop solar capacity availability.",
  url: "https://solarundo.prasanthp.tech",
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <main className="solar-gradient min-h-screen flex flex-col items-center py-10 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <AppLogo size="lg" className="mb-6" />

        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Solar Slot{" "}
          <span style={{ color: "var(--primary)" }}>ഉണ്ടോ?</span>
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed">
          Instantly check rooftop solar capacity availability
          for your KSEB connection — transformer-level accuracy.
        </p>
      </div>

      {/* Workflow steps */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-center gap-0">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="step-dot active">1</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Details</p>
          </div>

          <div className="h-px w-12 bg-border mb-5" />

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="step-dot pending">2</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Verify</p>
          </div>

          <div className="h-px w-12 bg-border mb-5" />

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="step-dot pending">3</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Result</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="glass-card w-full max-w-md rounded-2xl p-7">
        <h2 className="text-base font-semibold mb-5 text-foreground">
          Enter your KSEB details
        </h2>
        <ConsumerForm />
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
        Your data is sent directly to KSEB servers and is never stored by this service.
      </p>

      <div className="mt-8 w-full">
        <FAQSection />
      </div>

      <div className="mt-10 w-screen">
        <Footer />
      </div>
    </main>
  );
}
