import { SubmitReadingClient } from "@/components/meter-reader/submit-reading-client";
import { PageHeader } from "@/components/ui/page-header";

export default function MeterReaderSubmitPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Meter Reader Submit"
        description="Enter current household meter reading and photo with inline validation and confirmation summary."
      />

      <SubmitReadingClient />
    </section>
  );
}
