"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";

type PressureFormErrors = {
  accountNumber?: string;
  pressurePsi?: string;
};

type PressureSummary = {
  id: string;
  accountNumber: string;
  pressurePsi: number;
  pressureUnit: string;
  recordedAt: string;
  isAnomaly: boolean;
  anomalyReason: string | null;
  notes: string | null;
};

export function SubmitPressureClient() {
  const [accountNumber, setAccountNumber] = useState("");
  const [pressurePsi, setPressurePsi] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<PressureFormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<PressureSummary | null>(null);

  function validate() {
    const nextErrors: PressureFormErrors = {};

    const normalizedAccountNumber = accountNumber.trim().toUpperCase();
    const pressureValue = Number(pressurePsi);

    if (!normalizedAccountNumber) {
      nextErrors.accountNumber = "Account number is required.";
    }

    if (!pressurePsi.trim()) {
      nextErrors.pressurePsi = "Pressure value is required.";
    } else if (!Number.isFinite(pressureValue) || pressureValue <= 0) {
      nextErrors.pressurePsi = "Pressure must be a positive number.";
    }

    setErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      accountNumber: normalizedAccountNumber,
      pressureValue,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(null);
    setConfirmationMessage(null);

    const validation = validate();

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/meter-reader/pressure-readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber: validation.accountNumber,
          pressurePsi: validation.pressureValue,
          notes,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        pressureReading?: {
          id: string;
          accountNumber: string;
          pressurePsi: number;
          pressureUnit: string;
          recordedAt: string;
          isAnomaly: boolean;
          anomalyReason: string | null;
          notes: string | null;
        };
      };

      if (!response.ok || !payload.pressureReading) {
        setSubmissionError(payload.message ?? "Unable to submit pressure reading.");
        return;
      }

      setSummary(payload.pressureReading);
      setConfirmationMessage(payload.message ?? "Pressure reading submitted successfully.");
      setPressurePsi("");
      setNotes("");
      setErrors({});
    } catch {
      setSubmissionError("Unable to submit pressure reading right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Submit Pressure Reading"
        description="Dedicated pressure capture flow separate from household consumption submission."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="pressureAccountNumber"
            label="Account Number"
            required
            error={errors.accountNumber}
          >
            <input
              id="pressureAccountNumber"
              value={accountNumber}
              onChange={(event) => {
                setAccountNumber(event.target.value.toUpperCase());
                setErrors((currentErrors) => ({ ...currentErrors, accountNumber: undefined }));
              }}
              placeholder="ACC-1001"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField
            id="pressurePsi"
            label="Pressure (psi)"
            required
            error={errors.pressurePsi}
            hint="Values <= 25 psi or >= 85 psi are flagged as pressure anomalies."
          >
            <input
              id="pressurePsi"
              value={pressurePsi}
              onChange={(event) => {
                setPressurePsi(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, pressurePsi: undefined }));
              }}
              placeholder="54"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField id="pressureNotes" label="Notes">
            <textarea
              id="pressureNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional observation notes"
              className="h-24 w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </FormField>

          {submissionError ? (
            <p className="sm:col-span-2 rounded-md border border-black/20 bg-foreground/[0.03] px-3 py-2 text-sm text-foreground">
              {submissionError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save Pressure Reading"}
          </button>
        </form>
      </Card>

      {confirmationMessage ? (
        <div className="rounded-md border border-black/20 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground">
          {confirmationMessage}
        </div>
      ) : null}

      <Card title="Pressure Summary" description="Latest persisted pressure reading details.">
        {summary ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={summary.isAnomaly ? "Anomaly" : "Normal"}
                tone={summary.isAnomaly ? "danger" : "success"}
              />
              <span className="text-foreground/70">Independent pressure stream persisted.</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="text-foreground/70">Pressure Reading ID:</span> {summary.id}
              </p>
              <p>
                <span className="text-foreground/70">Account:</span> {summary.accountNumber}
              </p>
              <p>
                <span className="text-foreground/70">Pressure:</span> {summary.pressurePsi}{" "}
                {summary.pressureUnit}
              </p>
              <p>
                <span className="text-foreground/70">Recorded At:</span>{" "}
                {new Date(summary.recordedAt).toLocaleString()}
              </p>
              <p>
                <span className="text-foreground/70">Reason:</span>{" "}
                {summary.anomalyReason ?? "Within baseline"}
              </p>
              <p>
                <span className="text-foreground/70">Notes:</span> {summary.notes ?? "None"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/70">
            Submit a pressure reading to view persisted pressure-stream details.
          </p>
        )}
      </Card>
    </div>
  );
}
