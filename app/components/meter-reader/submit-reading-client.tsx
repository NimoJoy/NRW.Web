"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";

type FormErrors = {
  accountNumber?: string;
  currentReading?: string;
  photo?: string;
};

type SubmissionSummary = {
  id: string;
  accountNumber: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  photoPath: string;
  recordedAt: string;
};

type LookupResponse = {
  previousReading: number;
  lastRecordedAt: string | null;
  message?: string;
};

export function SubmitReadingClient() {
  const searchParams = useSearchParams();

  const queryAccountNumber = searchParams.get("accountNumber")?.toUpperCase() ?? "";
  const queryPreviousReading = searchParams.get("previousReading") ?? "";

  const [accountNumber, setAccountNumber] = useState(queryAccountNumber);
  const [previousReading, setPreviousReading] = useState(queryPreviousReading);
  const [currentReading, setCurrentReading] = useState("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SubmissionSummary | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctionReading, setCorrectionReading] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionMessage, setCorrectionMessage] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);

  useEffect(() => {
    if (!queryAccountNumber) {
      return;
    }

    void fetchPreviousReading(queryAccountNumber);
  }, [queryAccountNumber]);

  function handleAccountNumberChange(nextAccountNumber: string) {
    const normalized = nextAccountNumber.toUpperCase();
    setAccountNumber(normalized);
    setErrors((currentErrors) => ({ ...currentErrors, accountNumber: undefined }));
    setLookupMessage(null);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhoto = event.target.files?.[0] ?? null;
    setSelectedPhotoFile(selectedPhoto);
    setSelectedPhotoName(selectedPhoto?.name ?? "");

    setErrors((currentErrors) => ({
      ...currentErrors,
      photo: undefined,
    }));
  }

  async function fetchPreviousReading(targetAccountNumber: string) {
    const normalizedAccountNumber = targetAccountNumber.trim().toUpperCase();

    if (!normalizedAccountNumber) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        accountNumber: "Account number is required.",
      }));
      return;
    }

    setIsLookupLoading(true);
    setLookupMessage(null);

    try {
      const response = await fetch(
        `/api/meter-reader/account-lookup?accountNumber=${encodeURIComponent(normalizedAccountNumber)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload = (await response.json()) as LookupResponse;

      if (!response.ok) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          accountNumber: payload.message ?? "Unable to fetch account details.",
        }));
        return;
      }

      setPreviousReading(String(payload.previousReading));
      setLookupMessage(
        payload.lastRecordedAt
          ? `Previous reading loaded from latest record (${new Date(payload.lastRecordedAt).toLocaleString()}).`
          : "No prior reading found. Previous reading defaulted to 0."
      );
      setErrors((currentErrors) => ({ ...currentErrors, accountNumber: undefined }));
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        accountNumber: "Unable to fetch previous reading right now.",
      }));
    } finally {
      setIsLookupLoading(false);
    }
  }

  function validateAndBuildSummary(): SubmissionSummary | null {
    const nextErrors: FormErrors = {};

    const normalizedAccountNumber = accountNumber.trim().toUpperCase();
    const previousReadingNumber = Number(previousReading);
    const currentReadingNumber = Number(currentReading);

    if (!normalizedAccountNumber) {
      nextErrors.accountNumber = "Account number is required.";
    }

    if (!currentReading.trim()) {
      nextErrors.currentReading = "Current reading is required.";
    } else if (!Number.isFinite(currentReadingNumber)) {
      nextErrors.currentReading = "Current reading must be a number.";
    } else if (
      Number.isFinite(previousReadingNumber) &&
      currentReadingNumber < previousReadingNumber
    ) {
      nextErrors.currentReading = "Current reading cannot be less than previous reading.";
    }

    if (!selectedPhotoFile || !selectedPhotoName) {
      nextErrors.photo = "Meter photo is required before submission.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      id: "pending",
      accountNumber: normalizedAccountNumber,
      previousReading: Number.isFinite(previousReadingNumber) ? previousReadingNumber : 0,
      currentReading: currentReadingNumber,
      consumption:
        currentReadingNumber - (Number.isFinite(previousReadingNumber) ? previousReadingNumber : 0),
      photoPath: selectedPhotoName,
      recordedAt: new Date().toISOString(),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(null);
    setConfirmationMessage(null);

    const nextSummary = validateAndBuildSummary();

    if (!nextSummary) {
      setSummary(null);
      return;
    }

    if (!selectedPhotoFile) {
      return;
    }

    setIsSubmitting(true);

    const payload = new FormData();
    payload.set("accountNumber", nextSummary.accountNumber);
    payload.set("previousReading", String(nextSummary.previousReading));
    payload.set("currentReading", String(nextSummary.currentReading));
    payload.set("photo", selectedPhotoFile);

    try {
      const response = await fetch("/api/meter-reader/readings", {
        method: "POST",
        body: payload,
      });

      const responseBody = (await response.json()) as {
        id?: string;
        accountNumber?: string;
        previousReading?: number;
        currentReading?: number;
        consumption?: number;
        photoPath?: string;
        recordedAt?: string;
        message?: string;
      };

      if (!response.ok) {
        setSubmissionError(responseBody.message ?? "Unable to submit reading.");
        return;
      }

      setSummary({
        id: responseBody.id ?? "unknown",
        accountNumber: responseBody.accountNumber ?? nextSummary.accountNumber,
        previousReading: Number(responseBody.previousReading ?? nextSummary.previousReading),
        currentReading: Number(responseBody.currentReading ?? nextSummary.currentReading),
        consumption: Number(responseBody.consumption ?? nextSummary.consumption),
        photoPath: responseBody.photoPath ?? selectedPhotoName,
        recordedAt: responseBody.recordedAt ?? new Date().toISOString(),
      });

      setConfirmationMessage(responseBody.message ?? "Reading submitted successfully.");
      setCorrectionReading(String(responseBody.currentReading ?? nextSummary.currentReading));
      setCorrectionReason("");
      setCorrectionError(null);
      setCorrectionMessage(null);
      setCurrentReading("");
      setSelectedPhotoFile(null);
      setSelectedPhotoName("");
    } catch {
      setSubmissionError("Unable to submit reading right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCorrectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!summary) {
      return;
    }

    setCorrectionError(null);
    setCorrectionMessage(null);

    const nextCorrectedReading = Number(correctionReading);
    const normalizedReason = correctionReason.trim();

    if (!Number.isFinite(nextCorrectedReading)) {
      setCorrectionError("Corrected reading must be a valid number.");
      return;
    }

    if (nextCorrectedReading < summary.previousReading) {
      setCorrectionError("Corrected reading cannot be less than previous reading.");
      return;
    }

    if (!normalizedReason) {
      setCorrectionError("Correction reason is required.");
      return;
    }

    setIsCorrecting(true);

    const previousSummary = summary;
    setSummary((current) =>
      current
        ? {
            ...current,
            currentReading: nextCorrectedReading,
            consumption: nextCorrectedReading - current.previousReading,
          }
        : current
    );

    try {
      const response = await fetch(
        `/api/meter-reader/readings/${encodeURIComponent(summary.id)}/correction`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentReading: nextCorrectedReading,
            reason: normalizedReason,
          }),
        }
      );

      const responseBody = (await response.json()) as {
        message?: string;
        reading?: {
          id: string;
          accountNumber: string;
          previousReading: number;
          currentReading: number;
          consumption: number;
          recordedAt: string;
        };
      };

      if (!response.ok || !responseBody.reading) {
        setSummary(previousSummary);
        setCorrectionError(responseBody.message ?? "Unable to save correction.");
        return;
      }

      setSummary((current) =>
        current
          ? {
              ...current,
              previousReading: responseBody.reading?.previousReading ?? current.previousReading,
              currentReading: responseBody.reading?.currentReading ?? current.currentReading,
              consumption: responseBody.reading?.consumption ?? current.consumption,
              recordedAt: responseBody.reading?.recordedAt ?? current.recordedAt,
            }
          : current
      );
      setCorrectionMessage(responseBody.message ?? "Reading correction saved.");
    } catch {
      setSummary(previousSummary);
      setCorrectionError("Unable to save correction right now.");
    } finally {
      setIsCorrecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Submit Reading"
        description="Live form with Supabase upload and reading insertion."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="accountNumber"
            label="Account Number"
            required
            error={errors.accountNumber}
          >
            <div className="flex gap-2">
              <input
                id="accountNumber"
                value={accountNumber}
                onChange={(event) => handleAccountNumberChange(event.target.value)}
                placeholder="ACC-1001"
                className="w-full px-3 py-2 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => void fetchPreviousReading(accountNumber)}
                disabled={isLookupLoading}
                className="app-btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLookupLoading ? "Loading..." : "Load Previous"}
              </button>
            </div>
          </FormField>

          <FormField
            id="previousReading"
            label="Previous Reading"
            hint={lookupMessage ?? "Load from latest reading after entering account number."}
          >
            <input
              id="previousReading"
              value={previousReading}
              onChange={(event) => setPreviousReading(event.target.value)}
              placeholder="1203"
              className="w-full px-3 py-2 text-sm"
            />
          </FormField>

          <FormField
            id="currentReading"
            label="Current Reading"
            required
            error={errors.currentReading}
          >
            <input
              id="currentReading"
              value={currentReading}
              onChange={(event) => {
                setCurrentReading(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, currentReading: undefined }));
              }}
              placeholder="1260"
              className="w-full px-3 py-2 text-sm"
              required
            />
          </FormField>

          <FormField id="photo" label="Meter Photo" required error={errors.photo}>
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="w-full px-3 py-2 text-sm"
              required
            />
          </FormField>

          {submissionError ? (
            <p className="app-banner app-banner-error sm:col-span-2">{submissionError}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="app-btn-primary sm:col-span-2 w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save Reading"}
          </button>
        </form>
      </Card>

      {confirmationMessage ? (
        <div className="app-banner app-banner-success">{confirmationMessage}</div>
      ) : null}

      <Card
        title="Submission Summary"
        description="Values persisted to Supabase for this submission."
      >
        {summary ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge label="Persisted" tone="success" />
              <span className="text-[color:var(--muted)]">Supabase reading record inserted.</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="text-[color:var(--muted)]">Reading ID:</span> {summary.id}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Account:</span> {summary.accountNumber}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Previous:</span> {summary.previousReading}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Current:</span> {summary.currentReading}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Consumption:</span> {summary.consumption}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Photo Path:</span> {summary.photoPath}
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Recorded At:</span>{" "}
                {new Date(summary.recordedAt).toLocaleString()}
              </p>
            </div>

            <div className="border-t border-[color:var(--border)] pt-3">
              <h4 className="text-sm font-medium">Correction Flow</h4>
              <p className="mb-3 text-xs leading-6 text-[color:var(--muted)]">
                Meter readers can correct their own submissions within 24 hours. All corrections are
                permission-checked and audit logged.
              </p>

              <form onSubmit={handleCorrectionSubmit} className="grid gap-3 sm:grid-cols-2">
                <FormField id="correctionReading" label="Corrected Current Reading" required>
                  <input
                    id="correctionReading"
                    value={correctionReading}
                    onChange={(event) => setCorrectionReading(event.target.value)}
                    className="w-full px-3 py-2 text-sm"
                    required
                  />
                </FormField>

                <FormField id="correctionReason" label="Correction Reason" required>
                  <input
                    id="correctionReason"
                    value={correctionReason}
                    onChange={(event) => setCorrectionReason(event.target.value)}
                    placeholder="Photo blur, digit misread, etc."
                    className="w-full px-3 py-2 text-sm"
                    required
                  />
                </FormField>

                {correctionError ? (
                  <p className="app-banner app-banner-error sm:col-span-2">{correctionError}</p>
                ) : null}

                {correctionMessage ? (
                  <p className="app-banner app-banner-success sm:col-span-2">
                    {correctionMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isCorrecting}
                  className="app-btn-secondary sm:col-span-2 w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isCorrecting ? "Applying correction..." : "Apply Correction"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Fill and submit the form to persist a real reading and see confirmation details.
          </p>
        )}
      </Card>
    </div>
  );
}
