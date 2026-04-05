const kenyaShillingFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatCurrency(value: unknown) {
  return kenyaShillingFormatter.format(toFiniteNumber(value));
}

export function formatBillingPeriod(value: string) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  const directMatch = value.match(/^(\d{4})-(\d{2})/);
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}`;
  }

  return value;
}

export function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function safeRound(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
