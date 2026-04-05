type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-black/20 p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-foreground/70">{description}</p> : null}
    </div>
  );
}
