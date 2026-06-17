import ConsumerForm from "@/components/forms/ConsumerForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">
            Solar Undo
          </h1>

          <p className="text-muted-foreground mt-2">
            Check solar capacity availability
            for your KSEB connection
          </p>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm">
          <ConsumerForm />
        </div>
      </div>
    </main>
  );
}