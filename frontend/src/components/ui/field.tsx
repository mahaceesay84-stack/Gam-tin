import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const base =
  "w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 " +
  "shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-60 " +
  "dark:bg-white/5 dark:text-white dark:border-white/20";

const ok = "border-slate-300 focus:border-amber-500 focus:ring-amber-400/40";
const bad = "border-red-500 focus:border-red-500 focus:ring-red-400/40";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: (p: { id: string; describedBy?: string; cls: string }) => React.ReactNode;
};

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const hasMsg = !!(error || hint);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {children({ id, describedBy: hasMsg ? msgId : undefined, cls: error ? bad : ok })}
      {hasMsg && (
        <p id={msgId} className={`text-sm ${error ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", ...props }, ref) => (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, cls }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${base} ${cls} ${className}`}
          {...props}
        />
      )}
    </Field>
  )
);
Input.displayName = "Input";

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <Field label={label} hint={hint} error={error}>
        {({ id, describedBy, cls }) => (
          <div className="relative">
            <input
              ref={ref}
              id={id}
              type={show ? "text" : "password"}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              className={`${base} ${cls} pr-12 ${className}`}
              {...props}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-800"
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        )}
      </Field>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, placeholder, children, className = "", value, defaultValue, ...props }, ref) => (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, cls }) => (
        <select
          ref={ref}
          id={id}
          {...(value === undefined ? { defaultValue: defaultValue ?? "" } : { value })}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${base} ${cls} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
      )}
    </Field>
  )
);
Select.displayName = "Select";
