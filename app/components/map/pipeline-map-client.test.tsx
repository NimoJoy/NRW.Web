import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PipelineMapClient } from "@/components/map/pipeline-map-client";
import type {
  MapAccountOption,
  MapConnectionItem,
  MapMarkerItem,
  MapPipelineItem,
} from "@/lib/phase9/types";

const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.routerRefresh,
  }),
}));

const pipelines: MapPipelineItem[] = [
  {
    id: "pipe-1",
    name: "North Main",
    status: "normal",
    pressurePsi: 55,
    flowRateLpm: 120,
    material: "DI",
    diameterMm: 200,
    dataSource: "gis",
    points: [
      { x: 10, y: 20 },
      { x: 60, y: 70 },
    ],
  },
];

const markers: MapMarkerItem[] = [
  {
    id: "marker-1",
    label: "ACC-1001",
    type: "account",
    accountNumber: "ACC-1001",
    status: "normal",
    x: 20,
    y: 30,
  },
];

const accountOptions: MapAccountOption[] = [
  {
    accountNumber: "ACC-1001",
    customerName: "Amina Yusuf",
    pipelineId: "pipe-1",
  },
];

describe("PipelineMapClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.routerRefresh.mockReset();
  });

  it("creates a connection from map form", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Connection created." }),
    } as Response);

    render(
      <PipelineMapClient
        pipelines={pipelines}
        markers={markers}
        connections={[]}
        accountOptions={accountOptions}
        canManageConnections
      />
    );

    fireEvent.change(screen.getByDisplayValue("Select account"), {
      target: { value: "ACC-1001" },
    });
    fireEvent.change(screen.getByPlaceholderText("Latitude"), {
      target: { value: "6.500001" },
    });
    fireEvent.change(screen.getByPlaceholderText("Longitude"), {
      target: { value: "3.400001" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add connection" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/connections",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });

  it("edits an existing connection from map form", async () => {
    const existingConnections: MapConnectionItem[] = [
      {
        id: "conn-1",
        accountNumber: "ACC-1001",
        customerName: "Amina Yusuf",
        pipelineId: "pipe-1",
        pipelineName: "North Main",
        latitude: 6.5,
        longitude: 3.4,
        status: "active",
        notes: "initial",
        updatedAt: new Date().toISOString(),
      },
    ];

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Connection updated." }),
    } as Response);

    render(
      <PipelineMapClient
        pipelines={pipelines}
        markers={markers}
        connections={existingConnections}
        accountOptions={accountOptions}
        canManageConnections
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("6.5"), {
      target: { value: "6.7" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update connection" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/connections/conn-1",
        expect.objectContaining({ method: "PATCH" })
      );
    });
    expect(mocks.routerRefresh).toHaveBeenCalled();
  });
});
