import Link from "next/link";
import { connection } from "next/server";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/LoginForm";
import { resetTokenIsValid } from "@/app/actions/auth";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  await connection();
  const { token = "" } = await searchParams;
  if (!(await resetTokenIsValid(token))) {
    return (
      <AuthShell title="Link expired" sub="This reset link has expired or was already used. Links work once, for 1 hour.">
        <Link href="/forgot-password" className="btn-primary block w-full text-center">
          Send a new link
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" sub="At least 8 characters. You'll be signed out everywhere else.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
