"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, requestPasswordReset, resetPassword, setupFirstUser } from "@/app/actions/auth";
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
        <span className="flex items-baseline justify-between">
          <span className="label text-sand">Password</span>
          <Link href="/forgot-password" className="text-xs text-sand underline-offset-4 hover:text-cream hover:underline">
            Forgot password?
          </Link>
        </span>
        <input name="password" type="password" required autoComplete="current-password" className={dark} />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-sand">
        <input name="remember" type="checkbox" defaultChecked className="h-4 w-4 accent-brand" />
        Remember me on this device for 30 days
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

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label text-sand">Email</span>
        <input name="email" type="email" required autoComplete="email" className={dark} />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Sending…">
        Email me a reset link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-sand underline-offset-4 hover:text-cream hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="label text-sand">New password</span>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={dark} />
      </label>
      <label className="block">
        <span className="label text-sand">Confirm new password</span>
        <input name="confirm" type="password" minLength={8} required autoComplete="new-password" className={dark} />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
