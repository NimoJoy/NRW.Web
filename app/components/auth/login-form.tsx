"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { getSupportedCompany, supportedCompanies, type SupportedCompanyId } from "@/lib/auth/types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialMessage?: string;
};

export function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyId, setCompanyId] = useState<SupportedCompanyId>(supportedCompanies[0].id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialMessage ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    if (!getSupabasePublicEnv()) {
      setErrorMessage(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
      );
      setIsSubmitting(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const companyResponse = await fetch("/api/auth/company-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyId }),
    });

    if (!companyResponse.ok) {
      const companyPayload = (await companyResponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      setErrorMessage(companyPayload?.message ?? "Unable to establish company context.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 ? (
        <>
          <FormField id="companyId" label="Water Company" required>
            <select
              id="companyId"
              name="companyId"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value as SupportedCompanyId)}
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            >
              {supportedCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.id})
                </option>
              ))}
            </select>
          </FormField>

          <p className="text-sm text-black/70">
            Selected: {getSupportedCompany(companyId).name}. Continue to sign in with your role
            account.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-black/70">
            Company context: {getSupportedCompany(companyId).name} ({companyId})
          </p>

          <FormField id="email" label="Email" required>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>

          <FormField id="password" label="Password" required>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </FormField>
        </>
      )}

      {errorMessage ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : step === 1 ? "Continue" : "Sign in"}
      </button>

      {step === 2 ? (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setStep(1);
            setErrorMessage(null);
          }}
          className="w-full rounded-md border border-black/20 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
        >
          Change company
        </button>
      ) : null}
    </form>
  );
}
