"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateGB } from "@/lib/dates";

type DatePickerFieldProps = {
  label: string;
  hint: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  min?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  /** Fires when the user picks or clears a date */
  onSave?: (value: string) => void;
  readOnly?: boolean;
  readOnlyValue?: string | null;
};

function openCalendar(input: HTMLInputElement | null) {
  if (!input || input.disabled) return;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not triggered by user gesture in some browsers
    }
  }
  input.focus();
  input.click();
}

export function DatePickerField({
  label,
  hint,
  name,
  value: controlledValue,
  defaultValue = "",
  min,
  required,
  disabled,
  onChange,
  onSave,
  readOnly,
  readOnlyValue,
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const displayValue = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  function handleChange(next: string) {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
    onSave?.(next);
  }

  if (readOnly) {
    return (
      <div className="rounded-lg border border-vynedres-ink/10 bg-vynedres-paper/60 px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-vynedres-ink/75">{label}</p>
        <p className="mt-1 text-sm text-vynedres-ink">{formatDateGB(readOnlyValue)}</p>
        <p className="mt-1 text-xs text-vynedres-ink/50">{hint}</p>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-xs font-medium uppercase tracking-wide text-vynedres-ink/75"
      >
        {label}
        {required && <span className="text-vynedres-golddeep"> *</span>}
      </label>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={name}
          type="date"
          name={name}
          value={displayValue}
          min={min}
          required={required}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          className="date-picker-input w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper py-2 pl-3 pr-11 text-sm text-vynedres-ink focus:border-vynedres-gold/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openCalendar(inputRef.current)}
          className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-md text-vynedres-golddeep transition hover:bg-vynedres-gold/10 disabled:opacity-40"
          aria-label={`Open calendar for ${label}`}
          title="Open calendar"
        >
          <CalendarIcon />
        </button>
      </div>

      <p className="mt-1 text-xs text-vynedres-ink/50">{hint}</p>
      <p className="text-xs text-vynedres-ink/45">dd/mm/yyyy — pick a date to save</p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
