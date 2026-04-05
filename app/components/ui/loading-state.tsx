type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-black/20 p-8 text-center">
      <p className="text-sm text-foreground/70">{label}</p>
    </div>
  );
}
