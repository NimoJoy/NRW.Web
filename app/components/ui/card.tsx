type CardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function Card({ title, description, actions, children, className }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface))] p-5 shadow-[var(--card-shadow)] backdrop-blur-xl sm:p-6 ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,188,255,0.16),transparent_34%)]" />

      {(title || description || actions) && (
        <div className="relative mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-semibold tracking-tight">{title}</h3> : null}
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
