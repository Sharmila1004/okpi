import { useId } from "react";

export default function Input({
                                label,
                                error,
                                className = "",
                                id,
                                ariaLabel,
                                ariaDescribedBy,
                                required,
                                ...props
                              }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
      [errorId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
      <label className="block space-y-2">
        {label ? (
            <span
                className="text-sm font-medium text-ink"
                id={`${inputId}-label`}
            >
          {label}
              {required && <span className="text-red-500"> *</span>}
        </span>
        ) : null}

        <input
            id={inputId}
            className={`control-surface ${className}`}
            aria-label={ariaLabel || label}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            required={required}
            {...props}
        />

        {error ? (
            <span
                id={errorId}
                className="text-sm text-rose-600"
                role="alert"
            >
          {error}
        </span>
        ) : null}
      </label>
  );
}