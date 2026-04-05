import { SubmitPressureClient } from "@/components/meter-reader/submit-pressure-client";
import { PageHeader } from "@/components/ui/page-header";

export default function MeterReaderPressurePage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Pressure Capture"
        description="Submit dedicated pressure readings independent of household consumption entry."
      />

      <SubmitPressureClient />
    </section>
  );
}
