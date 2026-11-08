"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { FieldError } from "@/components/ui/text-field";

/** Password input with a 44px show/hide toggle inside the field, as in the design. */
export function PasswordField({ id, label, error, helper, ...props }) {
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small text-ink">
        {label}
      </label>
      <div
        className={`flex h-12 items-center gap-3 rounded-base bg-field py-1 pl-4 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-light ${
          error ? "border-2 border-danger" : ""
        }`}
      >
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent text-body text-field-ink placeholder:text-field-muted focus:outline-none"
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-base focus-visible:outline-2 focus-visible:outline-accent-light"
        >
          <Icon name={visible ? "visibility-off" : "visibility"} size={24} />
        </button>
      </div>
      {helper && !error && (
        <p id={`${id}-helper`} className="text-small text-muted">
          {helper}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
