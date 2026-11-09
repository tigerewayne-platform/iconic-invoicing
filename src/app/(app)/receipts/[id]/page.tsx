import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { deletePayment } from "@/app/actions/documents";
import { getPayment, getSettings } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { appUrl, emailConfigured } from "@/lib/email";
import { receiptMessage, whatsappLink } from "@/lib/messages";
import { formatZAR } from "@/lib/money";
import { METHOD_LABEL } from "@/pdf/ReceiptPdf";
import { ConfirmButton } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { SendPanel } from "@/components/SendPanel";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [p, st] = await Promise.all([getPayment(Number((await params).id)), getSettings()]);
  if (!p) notFound();
  const isNew = (await searchParams).new;
  const inv = p.invoice;
  const c = inv.client;
  const link = `${appUrl()}/p/r/${p.publicToken}`;
  const msg = receiptMessage(p, st, link);
  const balance = inv.total - inv.amountPaid;

  return (
    <>
      <PageHeader
        back={{ href: "/receipts", label: "Receipts" }}
        eyebrow="Receipt"
        title={p.receiptNumber}
        actions={
          <>
            <a href={`/api/pdf/receipt/${p.id}`} target="_blank" className="btn-ghost">
              <Eye size={15} /> View PDF
            </a>
            <a href={`/api/pdf/receipt/${p.id}?download=1`} className="btn-ghost">
              <Download size={15} /> Download
            </a>
          </>
        }
      />
      {isNew ? (
        <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Payment recorded and receipt {p.receiptNumber} issued.{" "}
          {balance > 0 ? `${formatZAR(balance)} still outstanding on ${inv.number}.` : `${inv.number} is now paid in full.`} Send the receipt to the client below.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <div className="text-center">
            <p className="label">Amount received</p>
            <p className="font-serif text-5xl font-semibold text-ink">{formatZAR(p.amount)}</p>
            <p className="mt-1 text-sm text-mute">
              from {c.company || c.name} on {formatDate(p.paidAt)}
            </p>
          </div>
          <dl className="mt-8 divide-y divide-line/70 border-t border-line text-sm">
            {[
              ["Method", METHOD_LABEL[p.method]],
              ["Bank reference", p.reference || "—"],
              [
                "Invoice",
                <Link key="i" href={`/invoices/${inv.id}`} className="text-brand hover:underline">
                  {inv.number}
                </Link>,
              ],
              ["Invoice total", formatZAR(inv.total)],
              ["Balance now", balance > 0 ? formatZAR(balance) : "Paid in full"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between py-2.5">
                <dt className="text-mute">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <form action={deletePayment} className="mt-6">
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton className="btn-quiet px-0 text-xs hover:text-brand" message={`Delete receipt ${p.receiptNumber}? The payment will be removed from ${inv.number}.`}>
              Captured by mistake? Delete this receipt
            </ConfirmButton>
          </form>
        </section>
        <div>
          <SendPanel
            kind="receipt"
            id={p.id}
            to={c.email}
            subject={msg.subject}
            body={msg.text}
            link={link}
            whatsapp={c.phone ? whatsappLink(c.phone, msg.text) : null}
            emailReady={emailConfigured()}
          />
        </div>
      </div>
    </>
  );
}
