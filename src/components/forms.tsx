"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  name,
  value,
  formAction,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
  formAction?: (fd: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} formAction={formAction}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state) return null;
  if (state.error)
    return <p className="rounded-md bg-brand/5 px-3 py-2 text-sm text-brand ring-1 ring-brand/20">{state.error}</p>;
  if (state.ok)
    return <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">{state.ok}</p>;
  return null;
}

/** Plain button that asks for confirmation before submitting its form. */
export function ConfirmButton({ children, message, className = "btn-danger" }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
