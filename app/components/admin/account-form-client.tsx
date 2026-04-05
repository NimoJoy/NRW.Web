"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import type { AccountStatus, PipelineOption } from "@/lib/phase9/types";

type AccountFormValues = {
  accountNumber: string;
  customerName: string;
  address: string;
  pipelineId: string;
  status: AccountStatus;
  latitude: string;
  longitude: string;
};

type AccountFormClientProps = {
  mode: "create" | "edit";
  pipelineOptions: PipelineOption[];
  initialValues: AccountFormValues;
  accountNumberForEdit?: string;
  onSuccess?: (message: string) => void;
};

function normalizeCoordinateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function AccountFormClient({
  mode,
  pipelineOptions,
  initialValues,
  accountNumberForEdit,
  onSuccess,
}: AccountFormClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<AccountFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedAccountNumber = values.accountNumber.trim().toUpperCase();
    const normalizedCustomerName = values.customerName.trim();
    const latitude = normalizeCoordinateInput(values.latitude);
    const longitude = normalizeCoordinateInput(values.longitude);

    if (mode === "create" && !normalizedAccountNumber) {
      setErrorMessage("Account number is required.");
      return;
    }

    if (!normalizedCustomerName) {
      setErrorMessage("Customer name is required.");
      return;
    }

    if ((latitude === null) !== (longitude === null)) {
      setErrorMessage("Latitude and longitude must be provided together.");
      return;
    }

    if (latitude !== null && Number.isNaN(latitude)) {
      setErrorMessage("Latitude must be a valid number.");
      return;
    }

    if (longitude !== null && Number.isNaN(longitude)) {
      setErrorMessage("Longitude must be a valid number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/accounts"
          : `/api/admin/accounts/${encodeURIComponent(accountNumberForEdit ?? normalizedAccountNumber)}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(mode === "create" ? { accountNumber: normalizedAccountNumber } : {}),
          customerName: normalizedCustomerName,
          address: values.address,
          pipelineId: values.pipelineId || null,
          status: values.status,
          latitude,
          longitude,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "Unable to save account.");
        return;
      }

      const message = payload.message ?? "Account saved successfully.";
      setSuccessMessage(message);

      if (mode === "create") {
        setValues({
          accountNumber: "",
          customerName: "",
          address: "",
          pipelineId: "",
          status: "active",
          latitude: "",
          longitude: "",
        });
      }

      onSuccess?.(message);
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === "create" ? (
        <FormField id="accountNumber" label="Account Number" required>
          <input
            id="accountNumber"
            value={values.accountNumber}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                accountNumber: event.target.value.toUpperCase(),
              }))
            }
            placeholder="ACC-1201"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            required
          />
        </FormField>
      ) : null}

      <FormField id={`customerName-${mode}`} label="Customer Name" required>
        <input
          id={`customerName-${mode}`}
          value={values.customerName}
          onChange={(event) =>
            setValues((current) => ({ ...current, customerName: event.target.value }))
          }
          placeholder="Customer name"
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          required
        />
      </FormField>

      <FormField id={`address-${mode}`} label="Address">
        <input
          id={`address-${mode}`}
          value={values.address}
          onChange={(event) =>
            setValues((current) => ({ ...current, address: event.target.value }))
          }
          placeholder="Address"
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </FormField>

      <FormField id={`pipeline-${mode}`} label="Pipeline">
        <select
          id={`pipeline-${mode}`}
          value={values.pipelineId}
          onChange={(event) =>
            setValues((current) => ({ ...current, pipelineId: event.target.value }))
          }
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="">Unassigned</option>
          {pipelineOptions.map((pipeline) => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id={`status-${mode}`} label="Status" required>
        <select
          id={`status-${mode}`}
          value={values.status}
          onChange={(event) =>
            setValues((current) => ({ ...current, status: event.target.value as AccountStatus }))
          }
          className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="suspended">suspended</option>
        </select>
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id={`latitude-${mode}`} label="Latitude">
          <input
            id={`latitude-${mode}`}
            value={values.latitude}
            onChange={(event) =>
              setValues((current) => ({ ...current, latitude: event.target.value }))
            }
            placeholder="-1.2378"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </FormField>

        <FormField id={`longitude-${mode}`} label="Longitude">
          <input
            id={`longitude-${mode}`}
            value={values.longitude}
            onChange={(event) =>
              setValues((current) => ({ ...current, longitude: event.target.value }))
            }
            placeholder="36.8243"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </FormField>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Save Account Changes"}
      </button>
    </form>
  );
}
