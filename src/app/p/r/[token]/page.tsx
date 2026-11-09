import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayment, getSettings } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { PublicShell } from "@/components/PublicShell";

export const metadata = { title: "Receipt", robots: { index: false } };

export default async function PublicReceipt({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db.select().from(payments).where(eq(payments.publicToken, token));
  if (!row) notFound();
  const [p, st] = await Promise.all([getPayment(row.id), getSettings()]);
  if (!p) notFound();
  return (
    <PublicShell st={st}>
      <section className="card mx-auto max-w-md p-8 text-center">
        <p className="eyebrow">Receipt {p.receiptNumber}</p>
        <p className="mt-4 font-serif text-5xl font-semibold text-ink">{formatZAR(p.amount)}</p>
        <p className="mt-2 text-sm text-mute">
          received from {p.invoice.client.company || p.invoice.client.name} on {formatDate(p.paidAt)} against invoice {p.invoice.number}
        </p>
        <p className="mt-6 text-sm text-ink">
          {p.invoice.total - p.invoice.amountPaid > 0
            ? `Balance outstanding: ${formatZAR(p.invoice.total - p.invoice.amountPaid)}`
            : "Paid in full. Thank you."}
        </p>
        <a href={`/api/public/receipt/${token}?download=1`} className="btn-dark mt-6">
          <Download size={15} /> Download PDF
        </a>
      </section>
    </PublicShell>
  );
}
