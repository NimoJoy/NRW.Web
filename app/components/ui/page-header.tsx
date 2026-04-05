type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(145deg,var(--primary-soft),transparent_48%),linear-gradient(180deg,var(--surface-strong),var(--surface))] px-5 py-5 shadow-[var(--card-shadow)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
          Operational Workspace
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
