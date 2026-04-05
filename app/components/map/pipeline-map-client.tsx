"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ConnectionStatus,
  MapAccountOption,
  MapConnectionItem,
  MapMarkerItem,
  MapPipelineItem,
} from "@/lib/phase9/types";

function getPipelineStyle(status: "normal" | "maintenance" | "critical") {
  if (status === "maintenance") {
    return {
      className: "text-foreground/60",
      dashArray: "4 4",
    };
  }

  if (status === "critical") {
    return {
      className: "text-foreground",
      dashArray: "0",
    };
  }

  return {
    className: "text-foreground/80",
    dashArray: "0",
  };
}

function markerTone(status: "normal" | "warning" | "danger") {
  if (status === "danger") {
    return "danger" as const;
  }

  if (status === "warning") {
    return "warning" as const;
  }

  return "success" as const;
}

type PipelineMapClientProps = {
  pipelines: MapPipelineItem[];
  markers: MapMarkerItem[];
  connections: MapConnectionItem[];
  accountOptions: MapAccountOption[];
  canManageConnections: boolean;
};

function connectionTone(status: ConnectionStatus) {
  if (status === "inactive") {
    return "danger" as const;
  }

  if (status === "planned") {
    return "warning" as const;
  }

  return "success" as const;
}

export function PipelineMapClient({
  pipelines,
  markers,
  connections,
  accountOptions,
  canManageConnections,
}: PipelineMapClientProps) {
  const router = useRouter();
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? "all");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(
    connections[0]?.id ?? null
  );
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showAccounts, setShowAccounts] = useState(true);
  const [showPressurePoints, setShowPressurePoints] = useState(true);
  const [formState, setFormState] = useState({
    accountNumber: "",
    pipelineId: pipelines[0]?.id ?? "",
    latitude: "",
    longitude: "",
    status: "active" as ConnectionStatus,
    notes: "",
  });

  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? pipelines[0],
    [pipelines, selectedPipelineId]
  );

  const visiblePipelines = useMemo(() => {
    if (!selectedPipeline) {
      return [];
    }

    if (!showPipelines) {
      return [];
    }

    return pipelines.filter(
      (pipeline) => pipeline.id === selectedPipeline.id || selectedPipelineId === "all"
    );
  }, [pipelines, selectedPipeline, selectedPipelineId, showPipelines]);

  const visibleMarkers = useMemo(
    () =>
      markers.filter((marker) => {
        if (marker.type === "account" && !showAccounts) {
          return false;
        }

        if (marker.type === "pressure_point" && !showPressurePoints) {
          return false;
        }

        return true;
      }),
    [markers, showAccounts, showPressurePoints]
  );

  const selectedMarker = visibleMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ?? null;

  const unmappedAccountOptions = useMemo(() => {
    const mappedAccounts = new Set(connections.map((connection) => connection.accountNumber));
    return accountOptions.filter((account) => !mappedAccounts.has(account.accountNumber));
  }, [accountOptions, connections]);

  function resetForm() {
    setEditingConnectionId(null);
    setFormState({
      accountNumber: "",
      pipelineId: pipelines[0]?.id ?? "",
      latitude: "",
      longitude: "",
      status: "active",
      notes: "",
    });
  }

  function handleAccountSelection(accountNumber: string) {
    const option = accountOptions.find((account) => account.accountNumber === accountNumber);

    setFormState((current) => ({
      ...current,
      accountNumber,
      pipelineId: option?.pipelineId ?? current.pipelineId,
    }));
  }

  function beginEditConnection(connection: MapConnectionItem) {
    setFormError(null);
    setFormSuccess(null);
    setEditingConnectionId(connection.id);
    setFormState({
      accountNumber: connection.accountNumber,
      pipelineId: connection.pipelineId,
      latitude: String(connection.latitude),
      longitude: String(connection.longitude),
      status: connection.status,
      notes: connection.notes ?? "",
    });
  }

  async function submitConnectionForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError(null);
    setFormSuccess(null);

    const latitude = Number(formState.latitude);
    const longitude = Number(formState.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setFormError("Latitude must be between -90 and 90.");
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setFormError("Longitude must be between -180 and 180.");
      return;
    }

    if (!formState.pipelineId) {
      setFormError("Pipeline is required.");
      return;
    }

    if (!editingConnectionId && !formState.accountNumber) {
      setFormError("Account is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        editingConnectionId
          ? `/api/admin/connections/${encodeURIComponent(editingConnectionId)}`
          : "/api/admin/connections",
        {
          method: editingConnectionId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editingConnectionId
              ? {
                  pipelineId: formState.pipelineId,
                  latitude,
                  longitude,
                  status: formState.status,
                  notes: formState.notes,
                }
              : {
                  accountNumber: formState.accountNumber,
                  pipelineId: formState.pipelineId,
                  latitude,
                  longitude,
                  status: formState.status,
                  notes: formState.notes,
                }
          ),
        }
      );

      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFormError(body.message ?? "Failed to save connection.");
        return;
      }

      setFormSuccess(body.message ?? "Connection saved.");
      resetForm();
      router.refresh();
    } catch {
      setFormError("Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Pipeline Map Canvas"
        description="UI-only map shell with placeholder layers and markers."
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={selectedPipelineId}
              onChange={(event) => setSelectedPipelineId(event.target.value)}
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="all">All pipelines</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-md border border-black/20 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={showPipelines}
                onChange={() => setShowPipelines((value) => !value)}
              />
              Pipelines layer
            </label>

            <label className="flex items-center gap-2 rounded-md border border-black/20 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={showAccounts}
                onChange={() => setShowAccounts((value) => !value)}
              />
              Account markers
            </label>

            <label className="flex items-center gap-2 rounded-md border border-black/20 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={showPressurePoints}
                onChange={() => setShowPressurePoints((value) => !value)}
              />
              Pressure markers
            </label>
          </div>

          <div className="relative h-80 overflow-hidden rounded-md border border-dashed border-black/20 bg-foreground/[0.03]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              aria-label="Pipeline placeholder map"
            >
              {visiblePipelines.map((pipeline) => {
                const style = getPipelineStyle(pipeline.status);

                return (
                  <polyline
                    key={pipeline.id}
                    points={pipeline.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={style.dashArray}
                    className={style.className}
                  />
                );
              })}
            </svg>

            {visibleMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                onClick={() => {
                  setSelectedMarkerId(marker.id);

                  if (marker.type === "account" && marker.accountNumber) {
                    const mappedConnection = connections.find(
                      (connection) => connection.accountNumber === marker.accountNumber
                    );

                    if (mappedConnection) {
                      setSelectedConnectionId(mappedConnection.id);
                    }
                  }
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 bg-background px-2 py-1 text-xs shadow-sm"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                {marker.type === "account" ? "A" : "P"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Selection Details" description="Selected pipeline and marker information.">
          {selectedPipeline ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-foreground/70">Pipeline:</span> {selectedPipeline.name}
              </p>
              <p>
                <span className="text-foreground/70">Pressure:</span> {selectedPipeline.pressurePsi}{" "}
                psi
              </p>
              <p>
                <span className="text-foreground/70">Flow Rate:</span>{" "}
                {selectedPipeline.flowRateLpm} L/min
              </p>
              <p>
                <span className="text-foreground/70">Pipe Material:</span>{" "}
                {selectedPipeline.material ?? "Not available"}
              </p>
              <p>
                <span className="text-foreground/70">Pipe Size:</span>{" "}
                {selectedPipeline.diameterMm ? `${selectedPipeline.diameterMm} mm` : "Not available"}
              </p>
              <p>
                <span className="text-foreground/70">Geometry Source:</span>{" "}
                {selectedPipeline.dataSource === "gis" ? "GIS" : "Supabase"}
              </p>
              <StatusBadge
                label={selectedPipeline.status}
                tone={markerTone(
                  selectedPipeline.status === "maintenance"
                    ? "warning"
                    : selectedPipeline.status === "critical"
                      ? "danger"
                      : "normal"
                )}
              />
            </div>
          ) : (
            <p className="text-sm text-foreground/70">No pipeline records available yet.</p>
          )}

          <div className="mt-4 border-t border-black/10 pt-4">
            {selectedMarker ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-foreground/70">Marker:</span> {selectedMarker.label}
                </p>
                <p>
                  <span className="text-foreground/70">Type:</span>{" "}
                  {selectedMarker.type === "account" ? "Account" : "Pressure Point"}
                </p>
                {selectedMarker.accountNumber ? (
                  <p>
                    <span className="text-foreground/70">Account:</span>{" "}
                    {selectedMarker.accountNumber}
                  </p>
                ) : null}
                {selectedMarker.pressurePsi ? (
                  <p>
                    <span className="text-foreground/70">Pressure:</span>{" "}
                    {selectedMarker.pressurePsi} psi
                  </p>
                ) : null}
                <StatusBadge
                  label={selectedMarker.status}
                  tone={markerTone(selectedMarker.status)}
                />
              </div>
            ) : (
              <p className="text-sm text-foreground/70">
                Select a marker on the map canvas to view details.
              </p>
            )}
          </div>

          <div className="mt-4 border-t border-black/10 pt-4">
            {selectedConnection ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-foreground/70">Connection:</span>{" "}
                  {selectedConnection.accountNumber}
                </p>
                <p>
                  <span className="text-foreground/70">Customer:</span>{" "}
                  {selectedConnection.customerName}
                </p>
                <p>
                  <span className="text-foreground/70">Pipeline:</span>{" "}
                  {selectedConnection.pipelineName}
                </p>
                <p>
                  <span className="text-foreground/70">Coordinates:</span>{" "}
                  {selectedConnection.latitude.toFixed(6)},{" "}
                  {selectedConnection.longitude.toFixed(6)}
                </p>
                <StatusBadge
                  label={selectedConnection.status}
                  tone={connectionTone(selectedConnection.status)}
                />
              </div>
            ) : (
              <p className="text-sm text-foreground/70">
                Select a mapped connection to view connection details.
              </p>
            )}
          </div>
        </Card>

        <Card title="Mapped Connections" description="Existing connection points with status.">
          {connections.length > 0 ? (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  role="button"
                  tabIndex={0}
                  className="w-full rounded-md border border-black/15 px-3 py-2 text-left text-sm hover:bg-foreground/5"
                  onClick={() => setSelectedConnectionId(connection.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedConnectionId(connection.id);
                    }
                  }}
                >
                  <p className="font-medium">
                    {connection.accountNumber} · {connection.customerName}
                  </p>
                  <p className="text-xs text-foreground/70">{connection.pipelineName}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge
                      label={connection.status}
                      tone={connectionTone(connection.status)}
                    />
                    {canManageConnections ? (
                      <button
                        type="button"
                        className="text-xs text-foreground/70 underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          beginEditConnection(connection);
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/70">No mapped connections yet.</p>
          )}
        </Card>

        {canManageConnections ? (
          <Card
            title={editingConnectionId ? "Edit Connection" : "Add Connection"}
            description="Create new mapped connections and update existing coordinates/status."
          >
            <form className="space-y-3" onSubmit={submitConnectionForm}>
              {editingConnectionId ? (
                <div className="rounded-md border border-black/15 px-3 py-2 text-sm">
                  <span className="text-foreground/70">Account:</span> {formState.accountNumber}
                </div>
              ) : (
                <select
                  value={formState.accountNumber}
                  onChange={(event) => handleAccountSelection(event.target.value)}
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="">Select account</option>
                  {unmappedAccountOptions.map((option) => (
                    <option key={option.accountNumber} value={option.accountNumber}>
                      {option.accountNumber} · {option.customerName}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={formState.pipelineId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, pipelineId: event.target.value }))
                }
                className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              >
                <option value="">Select pipeline</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.000001"
                  value={formState.latitude}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, latitude: event.target.value }))
                  }
                  placeholder="Latitude"
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={formState.longitude}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, longitude: event.target.value }))
                  }
                  placeholder="Longitude"
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    status: event.target.value as ConnectionStatus,
                  }))
                }
                className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              >
                <option value="active">active</option>
                <option value="planned">planned</option>
                <option value="inactive">inactive</option>
              </select>

              <textarea
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Notes (optional)"
                className="h-20 w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />

              {formError ? <p className="text-sm text-foreground">{formError}</p> : null}
              {formSuccess ? <p className="text-sm text-foreground">{formSuccess}</p> : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingConnectionId
                      ? "Update connection"
                      : "Add connection"}
                </button>

                {editingConnectionId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-foreground/10"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </Card>
        ) : null}

        <Card title="Legend" description="Placeholder visual key for map statuses.">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge label="normal" tone="success" />
              <span className="text-foreground/70">Stable pressure points</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label="maintenance" tone="warning" />
              <span className="text-foreground/70">Monitoring required</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label="critical" tone="danger" />
              <span className="text-foreground/70">Immediate attention</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
