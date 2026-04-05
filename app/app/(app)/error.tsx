"use client";

import { ErrorState } from "@/components/ui/error-state";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <ErrorState
      title="Page failed to render"
      description={error.message || "An unexpected UI error occurred."}
      retryLabel="Try again"
      onRetry={reset}
    />
  );
}
