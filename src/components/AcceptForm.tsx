"use client";

import { useActionState } from "react";
import { acceptQuote } from "@/app/actions/public";
import { FormMessage, SubmitButton } from "./forms";

export function AcceptForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [state, action] = useActionState(acceptQuote, undefined);
  if (state?.ok)
    return (
      <div className="rounded-xl bg-ink p-6 text-center text-cream">
        <p className="font-serif text-2xl font-semibold">Thank you, it&apos;s confirmed.</p>
        <p className="mt-1 text-sm text-sand">We&apos;ll send your deposit invoice shortly to lock in the date.</p>
      </div>
    );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="label">Your full name</span>
        <input name="name" className="input" defaultValue={defaultName} required />
      </label>
      <label className="flex items-start gap-2 text-xs text-mute">
        <input type="checkbox" name="agree" className="mt-0.5 accent-brand" />
        I accept this quotation and its terms, and understand a deposit is needed to secure the date.
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Confirming…">
        Accept quote
      </SubmitButton>
    </form>
  );
}
