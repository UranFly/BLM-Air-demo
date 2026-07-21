type StatusBadgeProps = {
  label: string;
  tone?: "idle" | "active" | "done" | "warning" | "danger";
};

export function StatusBadge({ label, tone = "idle" }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
