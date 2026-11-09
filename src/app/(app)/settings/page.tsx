import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { emailConfigured } from "@/lib/email";
import { PageHeader } from "@/components/ui";
import { BusinessSettings, PasswordForm, TeamSettings } from "@/components/SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const me = await requireUser();
  const [st, team] = await Promise.all([getSettings(), db.select().from(users).orderBy(asc(users.name))]);
  const welcome = (await searchParams).welcome;
  const admin = me.role === "admin";
  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" />
      {welcome ? (
        <p className="mb-6 rounded-lg bg-ink px-5 py-4 text-sm text-cream">
          <span className="font-medium text-brand">You&apos;re in.</span> Fill in your banking details and company info below first, they print on every
          quote and invoice. Then set prices in the Catalogue.
        </p>
      ) : null}
      <div className="space-y-6">
        <BusinessSettings st={st} admin={admin} />
        <TeamSettings users={team.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))} meId={me.id} admin={admin} />
        <PasswordForm />
        <section className="card p-6 text-sm">
          <h2 className="mb-2 font-serif text-xl font-semibold text-ink">Email sending</h2>
          {emailConfigured() ? (
            <p className="text-emerald-700">Connected. Quotes, invoices and receipts are emailed with the PDF attached.</p>
          ) : (
            <p className="text-mute">
              Not connected yet. Add <code className="rounded bg-paper px-1">RESEND_API_KEY</code> and <code className="rounded bg-paper px-1">EMAIL_FROM</code> in
              Vercel to email PDFs straight from here. Until then, use WhatsApp or the client link.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
