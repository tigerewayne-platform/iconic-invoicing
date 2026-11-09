import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { userCount } from "@/app/actions/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await connection();
  if ((await userCount()) === 0) redirect("/setup");
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" sub="Sign in to manage quotes, invoices and receipts.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
