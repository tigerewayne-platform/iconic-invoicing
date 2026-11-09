"use client";

import { useActionState } from "react";
import { login, setupFirstUser } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./forms";

const dark = "input border-white/10 bg-ink text-cream focus:border-white/40 focus:ring-white/5";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <label className="block">
        <span className="label text-sand">Email</span>
        <input name="email" type="email" required autoComplete="email" className={dark} />
      </label>
      <label className="block">
        <span className="label text-sand">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={dark} />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupFirstUser, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label text-sand">Your name</span>
        <input name="name" required className={dark} />
      </label>
      <label className="block">
        <span className="label text-sand">Email</span>
        <input name="email" type="email" required className={dark} />
      </label>
      <label className="block">
        <span className="label text-sand">Password</span>
        <input name="password" type="password" minLength={8} required className={dark} />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating…">
        Create admin account
      </SubmitButton>
    </form>
  );
}
