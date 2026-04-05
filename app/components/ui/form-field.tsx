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
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-foreground/60"> *</span> : null}
      </label>

      {children}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-foreground/60">{hint}</p>
      ) : null}
    </div>
  );
}
