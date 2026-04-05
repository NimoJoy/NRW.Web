type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="app-placeholder-surface p-8 text-center shadow-[var(--soft-shadow)]">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}
