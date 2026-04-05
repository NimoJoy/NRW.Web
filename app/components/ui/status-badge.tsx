type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneClassMap: Record<StatusTone, string> = {
  neutral: "app-status-neutral",
  success: "app-status-success",
  warning: "app-status-warning",
  danger: "app-status-danger",
  info: "app-status-info",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`app-status-badge ${toneClassMap[tone]}`}>
      {label}
    </span>
  );
}
