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
      className={`rounded-lg border border-black/10 bg-background p-4 sm:p-5 ${className ?? ""}`}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
            {description ? <p className="text-sm text-foreground/70">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
