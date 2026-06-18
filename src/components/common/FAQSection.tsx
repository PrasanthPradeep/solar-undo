import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Solar Undo?",
    answer:
      "Solar Undo helps KSEB consumers check the available rooftop solar capacity on their local transformer before applying for solar installation easily without going to the KSEB office. It is a free and independent tool that uses publicly available data from KSEB.",
  },
  {
    question: "Is Solar Undo an official KSEB website?",
    answer:
      "No. Solar Undo is an independent informational tool and is not affiliated with KSEB Ltd.",
  },
  {
    question: "Why do I need to enter my consumer number?",
    answer:
      "Your consumer number is used to identify your electrical section and transformer.",
  },
  {
    question: "Why is my registered mobile number required?",
    answer:
      "KSEB requires the registered mobile number to verify consumer details and access billing information when your transformer mapping is not already cached.",
  },
  {
    question: 'What does "Available Capacity" mean?',
    answer:
      "Available Capacity represents the remaining solar hosting capacity currently available on your transformer for new rooftop solar installations.",
  },
  {
    question: "Why did the available capacity change?",
    answer:
      "Capacity can change when new solar applications are approved, existing systems are commissioned, or transformer data is updated by KSEB.",
  },
  {
    question: "Does this guarantee solar approval?",
    answer:
      "No. Final approval depends on KSEB's verification and approval process.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "Solar Undo updates transformer data daily from publicly accessible KSEB sources.",
  },
] as const;

export { faqs };

export default function FAQSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-md">
      <div className="glass-card rounded-2xl p-6">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Quick answers about capacity checks, verification, and data freshness.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index + 1}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
