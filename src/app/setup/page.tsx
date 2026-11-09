import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SetupForm } from "@/components/LoginForm";
import { userCount } from "@/app/actions/auth";

export const metadata = { title: "Set up" };

export default async function SetupPage() {
  await connection();
  if ((await userCount()) > 0) redirect("/login");
  return (
    <AuthShell title="First-time setup" sub="Create the admin account. You can add staff logins afterwards in Settings.">
      <SetupForm />
    </AuthShell>
  );
}
