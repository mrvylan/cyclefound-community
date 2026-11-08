"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<ComponentProps<"input">, "type"> & {
  /** Extra classes for the input (padding-right for the toggle is applied). */
  inputClassName?: string;
};

/**
 * Password field with show/hide toggle. Matches SiteGate / auth input chrome.
 */
export function PasswordInput({
  className = "",
  inputClassName = "",
  id,
  ...rest
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        {...rest}
        id={id}
        type={show ? "text" : "password"}
        className={`pr-12 ${inputClassName}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        aria-controls={id}
        className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-ground hover:text-ink"
      >
        {show ? (
          <EyeOff className="size-4 stroke-[2]" aria-hidden />
        ) : (
          <Eye className="size-4 stroke-[2]" aria-hidden />
        )}
      </button>
    </div>
  );
}
