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
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-rose-800">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{description}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
