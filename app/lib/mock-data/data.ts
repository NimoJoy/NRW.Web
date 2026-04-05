export type AccountRow = {
  accountNumber: string;
  customerName: string;
  pipeline: string;
  status: "active" | "pending" | "suspended";
};

export type BillRow = {
  accountNumber: string;
  billingPeriod: string;
  amountDue: string;
  status: "paid" | "unpaid" | "overdue";
};

export type UserRow = {
  name: string;
  role: "meter_reader" | "admin";
  recentActivity: string;
  status: "active" | "inactive";
};

export type DashboardMetric = {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
};

export type AnomalyRow = {
  accountNumber: string;
  pressure: string;
  reason: string;
  severity: "warning" | "danger";
};

export type MeterLookupRow = {
  accountNumber: string;
  previousReading: number;
  lastPressurePsi: number;
  lastRecordedAt: string;
};

export type PipelineLayer = {
  id: string;
  name: string;
  status: "normal" | "maintenance" | "critical";
  pressurePsi: number;
  flowRateLpm: number;
  points: Array<{
    x: number;
    y: number;
  }>;
};

export type MapMarker = {
  id: string;
  label: string;
  type: "account" | "pressure_point";
  accountNumber?: string;
  pressurePsi?: number;
  status: "normal" | "warning" | "danger";
  x: number;
  y: number;
};

export type PressureTrendRow = {
  label: string;
  northMain: number;
  eastBranch: number;
  southLoop: number;
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Accounts", value: "200", tone: "info" },
  { label: "Readings Today", value: "5", tone: "neutral" },
  { label: "Pending Bills", value: "2", tone: "warning" },
  { label: "Critical Alerts", value: "5", tone: "danger" },
];

export const accountRows: AccountRow[] = [
  {
    accountNumber: "ACC-1001",
    customerName: "Amina Yusuf",
    pipeline: "North Main",
    status: "active",
  },
  {
    accountNumber: "ACC-1027",
    customerName: "Emeka Nnadi",
    pipeline: "East Branch",
    status: "active",
  },
  {
    accountNumber: "ACC-1103",
    customerName: "Halima Bello",
    pipeline: "South Loop",
    status: "active",
  },
];

export const billRows: BillRow[] = [
  {
    accountNumber: "ACC-1001",
    billingPeriod: "2026-02",
    amountDue: "KSh 12,450",
    status: "paid",
  },
  {
    accountNumber: "ACC-1027",
    billingPeriod: "2026-02",
    amountDue: "KSh 9,300",
    status: "unpaid",
  },
  {
    accountNumber: "ACC-1103",
    billingPeriod: "2026-02",
    amountDue: "KSh 15,770",
    status: "unpaid",
  },
];

export const userRows: UserRow[] = [
  {
    name: "Shaleen Kiragu",
    role: "meter_reader",
    recentActivity: "Submitted pressure reading for ACC-1003",
    status: "active",
  },
  {
    name: "Rock Ngugi",
    role: "meter_reader",
    recentActivity: "Uploaded reading for ACC-1027",
    status: "active",
  },
  {
    name: "James Kinaga",
    role: "admin",
    recentActivity: "Reviewed anomaly dashboard",
    status: "active",
  },
  {
    name: "Joy Wanyoike",
    role: "admin",
    recentActivity: "Reviewed billing records",
    status: "active",
  },
];

export const anomalyRows: AnomalyRow[] = [
  {
    accountNumber: "ACC-1103",
    pressure: "11 psi",
    reason: "Below configured threshold",
    severity: "warning",
  },
  {
    accountNumber: "ACC-1049",
    pressure: "95 psi",
    reason: "Spike above safe range",
    severity: "danger",
  },
];

export const quickFilters = ["Today", "This Week", "This Month", "Custom"];

export const meterLookupRows: MeterLookupRow[] = [
  {
    accountNumber: "ACC-1001",
    previousReading: 295,
    lastPressurePsi: 65,
    lastRecordedAt: "2026-03-10",
  },
  {
    accountNumber: "ACC-1027",
    previousReading: 280,
    lastPressurePsi: 42,
    lastRecordedAt: "2026-03-11",
  },
  {
    accountNumber: "ACC-1103",
    previousReading: 268,
    lastPressurePsi: 35,
    lastRecordedAt: "2026-03-09",
  },
];

export const pipelineLayers: PipelineLayer[] = [
  {
    id: "north-main",
    name: "North Main",
    status: "normal",
    pressurePsi: 65,
    flowRateLpm: 280,
    points: [
      { x: 8, y: 28 },
      { x: 35, y: 22 },
      { x: 62, y: 26 },
      { x: 90, y: 24 },
    ],
  },
  {
    id: "east-branch",
    name: "East Branch",
    status: "maintenance",
    pressurePsi: 41,
    flowRateLpm: 190,
    points: [
      { x: 45, y: 20 },
      { x: 58, y: 42 },
      { x: 72, y: 58 },
      { x: 87, y: 74 },
    ],
  },
  {
    id: "south-loop",
    name: "South Loop",
    status: "critical",
    pressurePsi: 35,
    flowRateLpm: 102,
    points: [
      { x: 22, y: 56 },
      { x: 34, y: 70 },
      { x: 52, y: 80 },
      { x: 70, y: 78 },
      { x: 80, y: 62 },
      { x: 66, y: 50 },
      { x: 44, y: 52 },
      { x: 26, y: 58 },
    ],
  },
];

export const mapMarkers: MapMarker[] = [
  {
    id: "marker-acc-1001",
    label: "Amina Yusuf",
    type: "account",
    accountNumber: "ACC-1001",
    status: "normal",
    x: 33,
    y: 24,
  },
  {
    id: "marker-acc-1027",
    label: "Emeka Nnadi",
    type: "account",
    accountNumber: "ACC-1027",
    status: "warning",
    x: 72,
    y: 60,
  },
  {
    id: "marker-acc-1103",
    label: "Halima Bello",
    type: "account",
    accountNumber: "ACC-1103",
    status: "danger",
    x: 49,
    y: 78,
  },
  {
    id: "marker-pressure-n1",
    label: "Pressure Sensor N1",
    type: "pressure_point",
    pressurePsi: 54,
    status: "normal",
    x: 58,
    y: 25,
  },
  {
    id: "marker-pressure-s2",
    label: "Pressure Sensor S2",
    type: "pressure_point",
    pressurePsi: 11,
    status: "danger",
    x: 64,
    y: 73,
  },
];

export const pressureTrendRows: PressureTrendRow[] = [
  { label: "Mon", northMain: 53, eastBranch: 44, southLoop: 22 },
  { label: "Tue", northMain: 54, eastBranch: 42, southLoop: 19 },
  { label: "Wed", northMain: 56, eastBranch: 43, southLoop: 18 },
  { label: "Thu", northMain: 55, eastBranch: 41, southLoop: 15 },
  { label: "Fri", northMain: 54, eastBranch: 40, southLoop: 14 },
  { label: "Sat", northMain: 52, eastBranch: 42, southLoop: 13 },
  { label: "Sun", northMain: 54, eastBranch: 41, southLoop: 16 },
];

export const reportRangeOptions = ["Last 7 days", "Last 30 days", "Quarter to date"];
export const reportPipelineOptions = ["All Pipelines", "North Main", "East Branch", "South Loop"];
