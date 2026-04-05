type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ id, label, required = false, hint, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required ? <span className="text-[color:var(--muted)]"> *</span> : null}
      </label>

      {children}

      {error ? (
        <p className="text-xs font-medium text-[color:var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[color:var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
