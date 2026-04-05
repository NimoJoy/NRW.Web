export type AccountStatus = "active" | "pending" | "suspended";
export type BillStatus = "paid" | "unpaid" | "overdue";
export type ProfileRole = "admin" | "meter_reader";
export type UserActivityStatus = "active" | "inactive";

export type AdminAccountListItem = {
  accountNumber: string;
  customerName: string;
  pipeline: string;
  status: AccountStatus;
};

export type AdminAccountDetailsItem = {
  accountNumber: string;
  customerName: string;
  pipelineId: string | null;
  pipeline: string;
  status: AccountStatus;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PipelineOption = {
  id: string;
  name: string;
};

export type AdminBillListItem = {
  id: string;
  accountNumber: string;
  billingPeriod: string;
  amountDue: string;
  rawAmountDue: number;
  status: BillStatus;
};

export type AdminReaderActivityItem = {
  userId: string;
  name: string;
  role: ProfileRole;
  recentActivity: string;
  status: UserActivityStatus;
};

export type MapPipelineStatus = "normal" | "maintenance" | "critical";
export type MapMarkerStatus = "normal" | "warning" | "danger";
export type ConnectionStatus = "active" | "planned" | "inactive";

export type MapPipelineItem = {
  id: string;
  name: string;
  status: MapPipelineStatus;
  pressurePsi: number;
  flowRateLpm: number;
  material: string | null;
  diameterMm: number | null;
  dataSource: "supabase" | "gis";
  points: Array<{
    x: number;
    y: number;
  }>;
};

export type MapMarkerItem = {
  id: string;
  label: string;
  type: "account" | "pressure_point";
  accountNumber?: string;
  pressurePsi?: number;
  status: MapMarkerStatus;
  x: number;
  y: number;
};

export type MapConnectionItem = {
  id: string;
  accountNumber: string;
  customerName: string;
  pipelineId: string;
  pipelineName: string;
  latitude: number;
  longitude: number;
  status: ConnectionStatus;
  notes: string | null;
  updatedAt: string;
};

export type MapAccountOption = {
  accountNumber: string;
  customerName: string;
  pipelineId: string | null;
};

export type ReportMetricItem = {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
};

export type ReportReadingItem = {
  id: string;
  accountNumber: string;
  pipeline: string;
  consumption: number | null;
  recordedAt: string;
  isAnomaly: boolean;
  anomalyReason: string | null;
};

export type PressureReportItem = {
  id: string;
  accountNumber: string;
  pipeline: string;
  pressurePsi: number;
  recordedAt: string;
  isAnomaly: boolean;
  anomalyReason: string | null;
};

export type ReportsDataset = {
  metrics: ReportMetricItem[];
  readings: ReportReadingItem[];
  pressureReadings: PressureReportItem[];
  pipelineOptions: string[];
};
