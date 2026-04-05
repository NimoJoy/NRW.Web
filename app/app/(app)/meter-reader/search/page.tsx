import { AccountSearchClient } from "@/components/meter-reader/account-search-client";
import { PageHeader } from "@/components/ui/page-header";

export default function MeterReaderSearchPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Meter Reader Search"
        description="Search for account numbers and return previous reading details before submission."
      />

      <AccountSearchClient />
    </section>
  );
}
