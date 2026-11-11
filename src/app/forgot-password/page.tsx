import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/LoginForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password" sub="Enter your login email and we'll send you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
