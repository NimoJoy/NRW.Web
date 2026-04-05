import { Card } from "@/components/ui/card";
import { PipelineMapClient } from "@/components/map/pipeline-map-client";
import { PageHeader } from "@/components/ui/page-header";
import { requireUserSession } from "@/lib/auth/session";
import { fetchMapDataset } from "@/lib/phase9/data";

export default async function MapPage() {
  const [{ pipelines, markers, connections, accountOptions }, { profile }] = await Promise.all([
    fetchMapDataset(),
    requireUserSession(),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Map"
        description="Pipeline map with Supabase overlays and GIS-enriched pipe attributes."
      />

      <Card
        title="Pipeline Visualization"
        description="Pipeline, account, and pressure markers with GIS pipe material and diameter."
      >
        <PipelineMapClient
          pipelines={pipelines}
          markers={markers}
          connections={connections}
          accountOptions={accountOptions}
          canManageConnections={profile.role === "admin"}
        />
      </Card>
    </section>
  );
}
