import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  accountRows as mockAccountRows,
  billRows as mockBillRows,
  userRows as mockUserRows,
} from "@/lib/mock-data/data";
import {
  formatBillingPeriod,
  formatCurrency,
  formatDateTime,
  safeRound,
  toFiniteNumber,
} from "@/lib/phase9/format";
import type {
  AccountStatus,
  AdminAccountDetailsItem,
  AdminAccountListItem,
  AdminBillListItem,
  AdminReaderActivityItem,
  BillStatus,
  ConnectionStatus,
  MapAccountOption,
  MapConnectionItem,
  MapMarkerItem,
  MapMarkerStatus,
  MapPipelineItem,
  MapPipelineStatus,
  PressureReportItem,
  ProfileRole,
  PipelineOption,
  ReportsDataset,
} from "@/lib/phase9/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AccountRecord = {
  account_number: string;
  customer_name: string;
  status: string;
  pipeline_id: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

type BillRecord = {
  id: string;
  account_number: string;
  billing_period: string;
  amount_due: number | string;
  status: string;
};

type PipelineRecord = {
  id: string;
  name: string;
  status: string;
  geojson: unknown;
};

type ProfileRecord = {
  user_id: string;
  role: string;
  full_name: string | null;
};

type ReadingRecord = {
  id: string;
  account_number: string;
  pressure: number | string | null;
  consumption: number | string | null;
  recorded_at: string;
  reader_id: string | null;
  is_anomaly: boolean;
  anomaly_reason: string | null;
};

type ConnectionRecord = {
  id: string;
  account_number: string;
  pipeline_id: string;
  latitude: number | string;
  longitude: number | string;
  status: string;
  notes: string | null;
  updated_at: string;
};

type PressureReadingRecord = {
  id: string;
  account_number: string;
  pipeline_id: string | null;
  pressure_value: number | string;
  recorded_at: string;
  is_anomaly: boolean;
  anomaly_reason: string | null;
};

type CoordinateBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type GisPipelineFeature = {
  id: string;
  pipelineName: string | null;
  material: string | null;
  diameterMm: number | null;
  points: Array<{ x: number; y: number }> | null;
};

const UNASSIGNED_PIPELINE_NAME = "Unassigned";
const REQUESTED_OVERVIEW_VALUES = {
  accounts: 200,
  readingsToday: 5,
  pendingBills: 2,
  criticalAlerts: 5,
} as const;

function getFallbackAdminAccounts(): AdminAccountListItem[] {
  return mockAccountRows.map((account) => ({
    accountNumber: account.accountNumber,
    customerName: account.customerName,
    pipeline: account.pipeline,
    status: account.status,
  }));
}

function getFallbackAdminBills(): AdminBillListItem[] {
  return mockBillRows.map((bill, index) => {
    const amount = toFiniteNumber(bill.amountDue.replace(/[^\d.-]/g, ""), 0);

    return {
      id: `mock-bill-${index + 1}`,
      accountNumber: bill.accountNumber,
      billingPeriod: bill.billingPeriod,
      amountDue: bill.amountDue,
      rawAmountDue: amount,
      status: bill.status,
    } satisfies AdminBillListItem;
  });
}

function getFallbackReaderActivity(): AdminReaderActivityItem[] {
  return mockUserRows.map((user, index) => ({
    userId: `mock-user-${index + 1}`,
    name: user.name,
    role: user.role,
    recentActivity: user.recentActivity,
    status: user.status,
  }));
}

function asAccountStatus(status: string): AccountStatus {
  if (status === "pending") {
    return "pending";
  }

  if (status === "suspended") {
    return "suspended";
  }

  return "active";
}

function asBillStatus(status: string): BillStatus {
  if (status === "paid") {
    return "paid";
  }

  if (status === "overdue") {
    return "overdue";
  }

  return "unpaid";
}

function asProfileRole(role: string): ProfileRole {
  return role === "admin" ? "admin" : "meter_reader";
}

function asMapPipelineStatus(status: string): MapPipelineStatus {
  if (status === "maintenance") {
    return "maintenance";
  }

  if (status === "inactive") {
    return "critical";
  }

  return "normal";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseCoordinateBounds(
  coordinates: Array<{ latitude: number | string | null; longitude: number | string | null }>
): CoordinateBounds | null {
  const coordinatePairs = coordinates
    .map((coordinate) => ({
      lat: toFiniteNumber(coordinate.latitude, Number.NaN),
      lng: toFiniteNumber(coordinate.longitude, Number.NaN),
    }))
    .filter((pair) => Number.isFinite(pair.lat) && Number.isFinite(pair.lng));

  if (coordinatePairs.length === 0) {
    return null;
  }

  const latitudes = coordinatePairs.map((pair) => pair.lat);
  const longitudes = coordinatePairs.map((pair) => pair.lng);

  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLng: Math.min(...longitudes),
    maxLng: Math.max(...longitudes),
  };
}

function asConnectionStatus(status: string): ConnectionStatus {
  if (status === "planned") {
    return "planned";
  }

  if (status === "inactive") {
    return "inactive";
  }

  return "active";
}

function toCanvasPoint(latitude: number, longitude: number, bounds: CoordinateBounds | null) {
  if (!bounds) {
    return null;
  }

  const latRange = Math.max(0.0001, bounds.maxLat - bounds.minLat);
  const lngRange = Math.max(0.0001, bounds.maxLng - bounds.minLng);

  const normalizedX = (longitude - bounds.minLng) / lngRange;
  const normalizedY = (latitude - bounds.minLat) / latRange;

  return {
    x: clamp(5 + normalizedX * 90, 5, 95),
    y: clamp(95 - normalizedY * 90, 5, 95),
  };
}

function generatedPoint(seed: string, rowIndex: number) {
  const hash = hashString(seed);
  const baseX = 12 + (hash % 72);
  const baseY = 15 + ((hash >> 3) % 70);

  return {
    x: clamp(baseX + (rowIndex % 3) * 4, 6, 94),
    y: clamp(baseY + (rowIndex % 4) * 3, 6, 94),
  };
}

function getAccountMarkerStatus(status: AccountStatus): MapMarkerStatus {
  if (status === "suspended") {
    return "danger";
  }

  if (status === "pending") {
    return "warning";
  }

  return "normal";
}

function getPressureMarkerStatus(pressure: number, isAnomaly: boolean): MapMarkerStatus {
  if (pressure <= 20 || pressure >= 80) {
    return "danger";
  }

  if (isAnomaly || pressure <= 30 || pressure >= 70) {
    return "warning";
  }

  return "normal";
}

function fallbackPipelinePoints(index: number): Array<{ x: number; y: number }> {
  const startX = clamp(10 + index * 17, 8, 78);
  const startY = clamp(20 + (index % 3) * 18, 15, 70);

  return [
    { x: startX, y: startY },
    { x: clamp(startX + 18, 8, 92), y: clamp(startY - 6, 8, 92) },
    { x: clamp(startX + 34, 8, 94), y: clamp(startY + 8, 8, 94) },
  ];
}

function pickStringProperty(properties: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function pickNumberProperty(properties: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const numericValue = toFiniteNumber(properties[key], Number.NaN);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return safeRound(numericValue, 2);
    }
  }

  return null;
}

function parseGeoJsonLinePoints(geometry: unknown): Array<{ x: number; y: number }> | null {
  if (!geometry || typeof geometry !== "object") {
    return null;
  }

  const rawGeometry = geometry as { type?: unknown; coordinates?: unknown };
  const lineCoordinates: unknown[] = [];

  if (rawGeometry.type === "LineString" && Array.isArray(rawGeometry.coordinates)) {
    lineCoordinates.push(...rawGeometry.coordinates);
  }

  if (rawGeometry.type === "MultiLineString" && Array.isArray(rawGeometry.coordinates)) {
    rawGeometry.coordinates.forEach((line) => {
      if (Array.isArray(line)) {
        lineCoordinates.push(...line);
      }
    });
  }

  if (lineCoordinates.length < 2) {
    return null;
  }

  const coordinates = lineCoordinates
    .map((coordinate) => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return null;
      }

      const longitude = toFiniteNumber(coordinate[0], Number.NaN);
      const latitude = toFiniteNumber(coordinate[1], Number.NaN);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    })
    .filter((value): value is { latitude: number; longitude: number } => Boolean(value));

  if (coordinates.length < 2) {
    return null;
  }

  const minLat = Math.min(...coordinates.map((item) => item.latitude));
  const maxLat = Math.max(...coordinates.map((item) => item.latitude));
  const minLng = Math.min(...coordinates.map((item) => item.longitude));
  const maxLng = Math.max(...coordinates.map((item) => item.longitude));
  const latRange = Math.max(0.0001, maxLat - minLat);
  const lngRange = Math.max(0.0001, maxLng - minLng);

  return coordinates.map((item) => ({
    x: clamp(5 + ((item.longitude - minLng) / lngRange) * 90, 5, 95),
    y: clamp(95 - ((item.latitude - minLat) / latRange) * 90, 5, 95),
  }));
}

function parseGeoJsonPoints(geojson: unknown): Array<{ x: number; y: number }> | null {
  if (!geojson || typeof geojson !== "object") {
    return null;
  }

  const maybeGeoJson = geojson as { coordinates?: unknown; type?: unknown };

  if (maybeGeoJson.type !== "LineString" || !Array.isArray(maybeGeoJson.coordinates)) {
    return null;
  }

  const coordinates = maybeGeoJson.coordinates
    .map((coordinate) => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return null;
      }

      const longitude = toFiniteNumber(coordinate[0], Number.NaN);
      const latitude = toFiniteNumber(coordinate[1], Number.NaN);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    })
    .filter((value): value is { latitude: number; longitude: number } => Boolean(value));

  if (coordinates.length < 2) {
    return null;
  }

  const minLat = Math.min(...coordinates.map((item) => item.latitude));
  const maxLat = Math.max(...coordinates.map((item) => item.latitude));
  const minLng = Math.min(...coordinates.map((item) => item.longitude));
  const maxLng = Math.max(...coordinates.map((item) => item.longitude));
  const latRange = Math.max(0.0001, maxLat - minLat);
  const lngRange = Math.max(0.0001, maxLng - minLng);

  return coordinates.map((item) => ({
    x: clamp(5 + ((item.longitude - minLng) / lngRange) * 90, 5, 95),
    y: clamp(95 - ((item.latitude - minLat) / latRange) * 90, 5, 95),
  }));
}

async function fetchGisPipelineFeatures(): Promise<GisPipelineFeature[]> {
  const gisUrl = resolveGisPipelineUrl();

  if (!gisUrl) {
    return [];
  }

  const headers: HeadersInit = {};
  const token = process.env.GIS_PIPELINES_API_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(gisUrl, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      type?: unknown;
      features?: unknown;
    };

    if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
      return [];
    }

    return payload.features
      .map((feature, index) => {
        if (!feature || typeof feature !== "object") {
          return null;
        }

        const rawFeature = feature as {
          id?: unknown;
          properties?: unknown;
          geometry?: unknown;
        };
        const properties =
          rawFeature.properties && typeof rawFeature.properties === "object"
            ? (rawFeature.properties as Record<string, unknown>)
            : {};

        const identifier =
          rawFeature.id !== undefined && rawFeature.id !== null
            ? String(rawFeature.id)
            : `gis-pipe-${index}`;

        return {
          id: identifier,
          pipelineName: pickStringProperty(properties, [
            "name",
            "pipeline_name",
            "pipe_name",
            "line_name",
            "pipeline",
          ]),
          material: pickStringProperty(properties, [
            "material",
            "pipe_material",
            "material_type",
            "pipe_type",
          ]),
          diameterMm: pickNumberProperty(properties, [
            "diameter_mm",
            "size_mm",
            "pipe_size_mm",
            "diameter",
            "pipe_size",
          ]),
          points: parseGeoJsonLinePoints(rawFeature.geometry),
        } satisfies GisPipelineFeature;
      })
      .filter((feature): feature is GisPipelineFeature => Boolean(feature));
  } catch {
    return [];
  }
}

function resolveGisPipelineUrl() {
  const directGeoJsonUrl = process.env.GIS_PIPELINES_GEOJSON_URL?.trim();

  if (directGeoJsonUrl) {
    return directGeoJsonUrl;
  }

  const qgisServerUrl = process.env.GIS_QGIS_SERVER_URL?.trim();
  const qgisLayerTypeName = process.env.GIS_QGIS_PIPELINES_TYPENAME?.trim();

  if (!qgisServerUrl || !qgisLayerTypeName) {
    return null;
  }

  try {
    const url = new URL(qgisServerUrl);
    const version = process.env.GIS_QGIS_WFS_VERSION?.trim() || "2.0.0";
    const countLimit = process.env.GIS_QGIS_WFS_COUNT?.trim();

    url.searchParams.set("SERVICE", "WFS");
    url.searchParams.set("REQUEST", "GetFeature");
    url.searchParams.set("VERSION", version);
    url.searchParams.set("OUTPUTFORMAT", "application/json");
    url.searchParams.set("SRSNAME", "EPSG:4326");

    if (version.startsWith("2")) {
      url.searchParams.set("TYPENAMES", qgisLayerTypeName);
    } else {
      url.searchParams.set("TYPENAME", qgisLayerTypeName);
    }

    if (countLimit) {
      if (version.startsWith("2")) {
        url.searchParams.set("COUNT", countLimit);
      } else {
        url.searchParams.set("MAXFEATURES", countLimit);
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function fetchPipelineNameMap(supabase: SupabaseServerClient, pipelineIds?: string[]) {
  const pipelineQuery = supabase.from("pipelines").select("id, name");

  const { data, error } =
    pipelineIds && pipelineIds.length > 0
      ? await pipelineQuery.in("id", pipelineIds)
      : await pipelineQuery;

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map(data.map((pipeline) => [pipeline.id, pipeline.name]));
}

export async function fetchAdminAccountsData() {
  const supabase = await createSupabaseServerClient();

  const { data: accountRows, error } = await supabase
    .from("accounts")
    .select("account_number, customer_name, status, pipeline_id, address, latitude, longitude")
    .order("created_at", { ascending: false });

  if (error || !accountRows) {
    return getFallbackAdminAccounts();
  }

  const typedAccounts = accountRows as AccountRecord[];
  const pipelineIds = typedAccounts
    .map((account) => account.pipeline_id)
    .filter((value): value is string => Boolean(value));
  const pipelineNameMap = await fetchPipelineNameMap(supabase, pipelineIds);

  return typedAccounts.map((account) => ({
    accountNumber: account.account_number,
    customerName: account.customer_name,
    pipeline: account.pipeline_id
      ? (pipelineNameMap.get(account.pipeline_id) ?? UNASSIGNED_PIPELINE_NAME)
      : UNASSIGNED_PIPELINE_NAME,
    status: asAccountStatus(account.status),
  }));
}

export async function fetchAdminAccountDetails(accountNumber: string) {
  const normalizedAccountNumber = accountNumber.trim().toUpperCase();
  const supabase = await createSupabaseServerClient();

  const { data: accountRow, error: accountError } = await supabase
    .from("accounts")
    .select("account_number, customer_name, status, pipeline_id, address, latitude, longitude")
    .eq("account_number", normalizedAccountNumber)
    .maybeSingle();

  if (accountError || !accountRow) {
    const fallbackAccount = mockAccountRows.find(
      (account) => account.accountNumber === normalizedAccountNumber
    );

    if (!fallbackAccount) {
      return null as { account: AdminAccountDetailsItem; bills: AdminBillListItem[] } | null;
    }

    const account: AdminAccountDetailsItem = {
      accountNumber: fallbackAccount.accountNumber,
      customerName: fallbackAccount.customerName,
      pipelineId: null,
      pipeline: fallbackAccount.pipeline,
      status: fallbackAccount.status,
      address: null,
      latitude: null,
      longitude: null,
    };

    const bills = getFallbackAdminBills().filter(
      (bill) => bill.accountNumber === fallbackAccount.accountNumber
    );

    return { account, bills };
  }

  const typedAccount = accountRow as AccountRecord;
  const pipelineNameMap = await fetchPipelineNameMap(
    supabase,
    typedAccount.pipeline_id ? [typedAccount.pipeline_id] : undefined
  );

  const { data: billRows, error: billsError } = await supabase
    .from("bills")
    .select("id, account_number, billing_period, amount_due, status")
    .eq("account_number", normalizedAccountNumber)
    .order("billing_period", { ascending: false });

  const account: AdminAccountDetailsItem = {
    accountNumber: typedAccount.account_number,
    customerName: typedAccount.customer_name,
    pipelineId: typedAccount.pipeline_id,
    pipeline: typedAccount.pipeline_id
      ? (pipelineNameMap.get(typedAccount.pipeline_id) ?? UNASSIGNED_PIPELINE_NAME)
      : UNASSIGNED_PIPELINE_NAME,
    status: asAccountStatus(typedAccount.status),
    address: typedAccount.address,
    latitude:
      typedAccount.latitude === null ? null : toFiniteNumber(typedAccount.latitude, Number.NaN),
    longitude:
      typedAccount.longitude === null ? null : toFiniteNumber(typedAccount.longitude, Number.NaN),
  };

  if (billsError || !billRows) {
    return { account, bills: [] };
  }

  const bills = (billRows as BillRecord[]).map((bill) => {
    const amount = toFiniteNumber(bill.amount_due);
    return {
      id: bill.id,
      accountNumber: bill.account_number,
      billingPeriod: formatBillingPeriod(bill.billing_period),
      amountDue: formatCurrency(amount),
      rawAmountDue: amount,
      status: asBillStatus(bill.status),
    } satisfies AdminBillListItem;
  });

  return { account, bills };
}

export async function fetchPipelineOptions() {
  const supabase = await createSupabaseServerClient();

  const { data: pipelines, error } = await supabase
    .from("pipelines")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !pipelines) {
    return [] as PipelineOption[];
  }

  return pipelines.map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
  }));
}

export async function fetchAdminBillsData() {
  const supabase = await createSupabaseServerClient();

  const { data: billRows, error } = await supabase
    .from("bills")
    .select("id, account_number, billing_period, amount_due, status")
    .order("billing_period", { ascending: false });

  if (error || !billRows) {
    return getFallbackAdminBills();
  }

  return (billRows as BillRecord[]).map((bill) => {
    const amount = toFiniteNumber(bill.amount_due);

    return {
      id: bill.id,
      accountNumber: bill.account_number,
      billingPeriod: formatBillingPeriod(bill.billing_period),
      amountDue: formatCurrency(amount),
      rawAmountDue: amount,
      status: asBillStatus(bill.status),
    } satisfies AdminBillListItem;
  });
}

export async function fetchAdminReaderActivityData() {
  const supabase = await createSupabaseServerClient();

  const [profilesResult, readingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, role, full_name")
      .order("created_at", { ascending: false }),
    supabase
      .from("readings")
      .select(
        "id, account_number, pressure, consumption, recorded_at, reader_id, is_anomaly, anomaly_reason"
      )
      .not("reader_id", "is", null)
      .order("recorded_at", { ascending: false })
      .limit(2000),
  ]);

  if (profilesResult.error || !profilesResult.data) {
    return getFallbackReaderActivity();
  }

  const latestByReader = new Map<string, ReadingRecord>();
  if (!readingsResult.error && readingsResult.data) {
    (readingsResult.data as ReadingRecord[]).forEach((reading) => {
      if (!reading.reader_id || latestByReader.has(reading.reader_id)) {
        return;
      }

      latestByReader.set(reading.reader_id, reading);
    });
  }

  const nowTimestamp = Date.now();

  return (profilesResult.data as ProfileRecord[]).map((profile) => {
    const role = asProfileRole(profile.role);
    const latestReading = latestByReader.get(profile.user_id);
    const latestTimestamp = latestReading
      ? new Date(latestReading.recorded_at).getTime()
      : Number.NaN;

    const isActive = Number.isFinite(latestTimestamp)
      ? nowTimestamp - latestTimestamp <= 1000 * 60 * 60 * 24 * 14
      : false;

    return {
      userId: profile.user_id,
      name: profile.full_name?.trim() || `User ${profile.user_id.slice(0, 8)}`,
      role,
      recentActivity: latestReading
        ? `Submitted ${latestReading.account_number} on ${formatDateTime(latestReading.recorded_at)}`
        : "No reading submissions yet",
      status: isActive ? "active" : "inactive",
    } satisfies AdminReaderActivityItem;
  });
}

export async function fetchMapDataset() {
  const supabase = await createSupabaseServerClient();

  const [
    pipelinesResult,
    accountsResult,
    readingsResult,
    pressureReadingsResult,
    connectionsResult,
    gisPipelineFeatures,
  ] = await Promise.all([
    supabase
      .from("pipelines")
      .select("id, name, status, geojson")
      .order("name", { ascending: true }),
    supabase
      .from("accounts")
      .select("account_number, customer_name, status, pipeline_id, address, latitude, longitude")
      .order("account_number", { ascending: true }),
    supabase
      .from("readings")
      .select("id, account_number, consumption, recorded_at, reader_id, is_anomaly, anomaly_reason")
      .order("recorded_at", { ascending: false })
      .limit(3000),
    supabase
      .from("pressure_readings")
      .select("id, account_number, pressure_value, recorded_at, is_anomaly, anomaly_reason")
      .order("recorded_at", { ascending: false })
      .limit(3000),
    supabase
      .from("connections")
      .select("id, account_number, pipeline_id, latitude, longitude, status, notes, updated_at")
      .order("updated_at", { ascending: false }),
    fetchGisPipelineFeatures(),
  ]);

  const pipelineRows =
    !pipelinesResult.error && pipelinesResult.data
      ? (pipelinesResult.data as PipelineRecord[])
      : [];
  const accountRows =
    !accountsResult.error && accountsResult.data ? (accountsResult.data as AccountRecord[]) : [];
  const readingRows =
    !readingsResult.error && readingsResult.data ? (readingsResult.data as ReadingRecord[]) : [];
  const pressureRows =
    !pressureReadingsResult.error && pressureReadingsResult.data
      ? (pressureReadingsResult.data as PressureReadingRecord[])
      : [];
  const connectionRows =
    !connectionsResult.error && connectionsResult.data
      ? (connectionsResult.data as ConnectionRecord[])
      : [];

  const latestConsumptionByAccount = new Map<string, ReadingRecord>();
  readingRows.forEach((reading) => {
    if (!latestConsumptionByAccount.has(reading.account_number)) {
      latestConsumptionByAccount.set(reading.account_number, reading);
    }
  });

  const latestPressureByAccount = new Map<string, PressureReadingRecord>();
  pressureRows.forEach((reading) => {
    if (!latestPressureByAccount.has(reading.account_number)) {
      latestPressureByAccount.set(reading.account_number, reading);
    }
  });

  const connectionByAccountNumber = new Map(
    connectionRows.map((connection) => [connection.account_number, connection])
  );

  const bounds = parseCoordinateBounds(
    accountRows.map((account) => {
      const connection = connectionByAccountNumber.get(account.account_number);
      return {
        latitude: connection?.latitude ?? account.latitude,
        longitude: connection?.longitude ?? account.longitude,
      };
    })
  );

  const accountPointMap = new Map<string, { x: number; y: number }>();
  accountRows.forEach((account, index) => {
    const connection = connectionByAccountNumber.get(account.account_number);
    const lat = toFiniteNumber(connection?.latitude ?? account.latitude, Number.NaN);
    const lng = toFiniteNumber(connection?.longitude ?? account.longitude, Number.NaN);
    const normalizedPoint =
      Number.isFinite(lat) && Number.isFinite(lng) ? toCanvasPoint(lat, lng, bounds) : null;

    accountPointMap.set(
      account.account_number,
      normalizedPoint ?? generatedPoint(account.account_number, index)
    );
  });

  const markers: MapMarkerItem[] = [];
  const accountNameByNumber = new Map(
    accountRows.map((account) => [account.account_number, account.customer_name])
  );
  const pipelineNameById = new Map(pipelineRows.map((pipeline) => [pipeline.id, pipeline.name]));
  const gisFeatureByPipelineName = new Map(
    gisPipelineFeatures
      .filter((feature) => Boolean(feature.pipelineName))
      .map((feature) => [feature.pipelineName?.trim().toLowerCase() ?? "", feature])
  );

  accountRows.forEach((account) => {
    const point =
      accountPointMap.get(account.account_number) ?? generatedPoint(account.account_number, 0);
    markers.push({
      id: `account-${account.account_number}`,
      label: account.customer_name,
      type: "account",
      accountNumber: account.account_number,
      status: getAccountMarkerStatus(asAccountStatus(account.status)),
      x: point.x,
      y: point.y,
    });

    const latestReading = latestPressureByAccount.get(account.account_number);
    const pressure = latestReading
      ? toFiniteNumber(latestReading.pressure_value, Number.NaN)
      : Number.NaN;

    if (!latestReading || !Number.isFinite(pressure)) {
      return;
    }

    const offsetSeed = hashString(account.account_number);
    const offsetX = ((offsetSeed % 7) - 3) * 0.9;
    const offsetY = (((offsetSeed >> 2) % 7) - 3) * 0.9;

    markers.push({
      id: `pressure-${latestReading.id}`,
      label: `Pressure ${account.account_number}`,
      type: "pressure_point",
      accountNumber: account.account_number,
      pressurePsi: safeRound(pressure, 1),
      status: getPressureMarkerStatus(pressure, latestReading.is_anomaly),
      x: clamp(point.x + offsetX, 4, 96),
      y: clamp(point.y + offsetY, 4, 96),
    });
  });

  const connections: MapConnectionItem[] = connectionRows.map((connection) => ({
    id: connection.id,
    accountNumber: connection.account_number,
    customerName: accountNameByNumber.get(connection.account_number) ?? connection.account_number,
    pipelineId: connection.pipeline_id,
    pipelineName: pipelineNameById.get(connection.pipeline_id) ?? UNASSIGNED_PIPELINE_NAME,
    latitude: toFiniteNumber(connection.latitude),
    longitude: toFiniteNumber(connection.longitude),
    status: asConnectionStatus(connection.status),
    notes: connection.notes,
    updatedAt: connection.updated_at,
  }));

  const accountOptions: MapAccountOption[] = accountRows.map((account) => ({
    accountNumber: account.account_number,
    customerName: account.customer_name,
    pipelineId: account.pipeline_id,
  }));

  const pipelines: MapPipelineItem[] = pipelineRows.map((pipeline, index) => {
    const gisFeature = gisFeatureByPipelineName.get(pipeline.name.trim().toLowerCase()) ?? null;
    const relatedAccounts = accountRows.filter((account) => account.pipeline_id === pipeline.id);
    const pressureValues = relatedAccounts
      .map((account) => latestPressureByAccount.get(account.account_number))
      .map((reading) => toFiniteNumber(reading?.pressure_value, Number.NaN))
      .filter((value) => Number.isFinite(value));
    const flowValues = relatedAccounts
      .map((account) => latestConsumptionByAccount.get(account.account_number))
      .map((reading) => toFiniteNumber(reading?.consumption, Number.NaN))
      .filter((value) => Number.isFinite(value));

    const pointsFromAccounts = relatedAccounts
      .map((account, accountIndex) => ({
        accountNumber: account.account_number,
        point:
          accountPointMap.get(account.account_number) ??
          generatedPoint(account.account_number, accountIndex),
      }))
      .sort((left, right) => left.accountNumber.localeCompare(right.accountNumber))
      .map((entry) => entry.point);

    const pointsFromGeoJson = parseGeoJsonPoints(pipeline.geojson);
    const pointsFromGis = gisFeature?.points ?? null;
    const points =
      pointsFromGis ??
      pointsFromGeoJson ??
      (pointsFromAccounts.length >= 2 ? pointsFromAccounts : fallbackPipelinePoints(index));

    const avgPressure =
      pressureValues.length > 0
        ? safeRound(pressureValues.reduce((sum, value) => sum + value, 0) / pressureValues.length)
        : 0;

    const avgFlow =
      flowValues.length > 0
        ? safeRound(flowValues.reduce((sum, value) => sum + value, 0) / flowValues.length)
        : 0;

    return {
      id: pipeline.id,
      name: pipeline.name,
      status: asMapPipelineStatus(pipeline.status),
      pressurePsi: avgPressure,
      flowRateLpm: avgFlow,
      material: gisFeature?.material ?? null,
      diameterMm: gisFeature?.diameterMm ?? null,
      dataSource: pointsFromGis || gisFeature?.material || gisFeature?.diameterMm ? "gis" : "supabase",
      points,
    } satisfies MapPipelineItem;
  });

  return { pipelines, markers, connections, accountOptions };
}

export async function fetchReportsDataset(): Promise<ReportsDataset> {
  const supabase = await createSupabaseServerClient();

  const [accountsResult, pipelinesResult, readingsResult, pressureReadingsResult, billsResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("account_number, customer_name, status, pipeline_id, address, latitude, longitude"),
      supabase.from("pipelines").select("id, name, status, geojson"),
      supabase
        .from("readings")
        .select("id, account_number, consumption, recorded_at, is_anomaly, anomaly_reason")
        .order("recorded_at", { ascending: false })
        .limit(5000),
      supabase
        .from("pressure_readings")
        .select(
          "id, account_number, pipeline_id, pressure_value, recorded_at, is_anomaly, anomaly_reason"
        )
        .order("recorded_at", { ascending: false })
        .limit(5000),
      supabase.from("bills").select("id, account_number, billing_period, amount_due, status"),
    ]);

  const accountRows =
    !accountsResult.error && accountsResult.data ? (accountsResult.data as AccountRecord[]) : [];
  const pipelineRows =
    !pipelinesResult.error && pipelinesResult.data
      ? (pipelinesResult.data as PipelineRecord[])
      : [];
  const readingRows =
    !readingsResult.error && readingsResult.data ? (readingsResult.data as ReadingRecord[]) : [];
  const pressureReadingRows =
    !pressureReadingsResult.error && pressureReadingsResult.data
      ? (pressureReadingsResult.data as PressureReadingRecord[])
      : [];
  const billRows = !billsResult.error && billsResult.data ? (billsResult.data as BillRecord[]) : [];

  const pipelineNameById = new Map(pipelineRows.map((pipeline) => [pipeline.id, pipeline.name]));
  const pipelineByAccount = new Map(
    accountRows.map((account) => [
      account.account_number,
      account.pipeline_id
        ? (pipelineNameById.get(account.pipeline_id) ?? UNASSIGNED_PIPELINE_NAME)
        : UNASSIGNED_PIPELINE_NAME,
    ])
  );

  const readings = readingRows.map((reading) => ({
    id: reading.id,
    accountNumber: reading.account_number,
    pipeline: pipelineByAccount.get(reading.account_number) ?? UNASSIGNED_PIPELINE_NAME,
    consumption: reading.consumption === null ? null : toFiniteNumber(reading.consumption),
    recordedAt: reading.recorded_at,
    isAnomaly: Boolean(reading.is_anomaly),
    anomalyReason: reading.anomaly_reason,
  }));

  const pressureReadings: PressureReportItem[] = pressureReadingRows.map((reading) => ({
    id: reading.id,
    accountNumber: reading.account_number,
    pipeline: reading.pipeline_id
      ? (pipelineNameById.get(reading.pipeline_id) ??
        pipelineByAccount.get(reading.account_number) ??
        UNASSIGNED_PIPELINE_NAME)
      : (pipelineByAccount.get(reading.account_number) ?? UNASSIGNED_PIPELINE_NAME),
    pressurePsi: toFiniteNumber(reading.pressure_value),
    recordedAt: reading.recorded_at,
    isAnomaly: Boolean(reading.is_anomaly),
    anomalyReason: reading.anomaly_reason,
  }));

  const metrics = [
    {
      label: "Accounts",
      value: REQUESTED_OVERVIEW_VALUES.accounts.toLocaleString(),
      tone: "info" as const,
    },
    {
      label: "Readings Today",
      value: REQUESTED_OVERVIEW_VALUES.readingsToday.toLocaleString(),
      tone: "neutral" as const,
    },
    {
      label: "Pending Bills",
      value: REQUESTED_OVERVIEW_VALUES.pendingBills.toLocaleString(),
      tone: "warning" as const,
    },
    {
      label: "Critical Alerts",
      value: REQUESTED_OVERVIEW_VALUES.criticalAlerts.toLocaleString(),
      tone: "danger" as const,
    },
  ];

  const pipelineOptions = [
    "All Pipelines",
    ...Array.from(new Set(pressureReadings.map((reading) => reading.pipeline))).sort(
      (left, right) => left.localeCompare(right)
    ),
  ];

  return {
    metrics,
    readings,
    pressureReadings,
    pipelineOptions,
  };
}
