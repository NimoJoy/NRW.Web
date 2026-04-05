type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="app-placeholder-surface p-8 text-center shadow-[var(--soft-shadow)]">
      <p className="text-sm text-[color:var(--muted)]">{label}</p>
    </div>
  );
}
