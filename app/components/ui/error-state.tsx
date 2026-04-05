type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  retryLabel = "Retry",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="app-banner app-banner-error p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{description}</p>
      {onRetry ? (
        <button
          type="button"
          className="app-btn-secondary mt-4"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
