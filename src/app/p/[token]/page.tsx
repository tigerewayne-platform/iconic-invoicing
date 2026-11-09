import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { displayStatus, getDocumentByToken, getSettings } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { documentTitle } from "@/pdf/DocumentPdf";
import { PublicShell } from "@/components/PublicShell";
import { AcceptForm } from "@/components/AcceptForm";

export const metadata = { title: "Your document", robots: { index: false } };

export default async function PublicDoc({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [doc, st] = await Promise.all([getDocumentByToken(token), getSettings()]);
  if (!doc || doc.status === "draft") notFound();
  const isQuote = doc.type === "quote";
  const state = displayStatus(doc);
  const title = documentTitle(doc.type, st, doc.vatEnabled);
  const balance = doc.total - doc.amountPaid;
  const deposit = doc.depositPercent > 0 ? Math.round((doc.total * doc.depositPercent) / 100) : 0;
  const dueNow = !isQuote ? (deposit > doc.amountPaid ? deposit - doc.amountPaid : balance) : 0;
  const c = doc.client;

  return (
    <PublicShell st={st}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">{title}</p>
          <h1 className="font-serif text-4xl font-semibold text-ink">{doc.number}</h1>
          <p className="mt-1 text-sm text-mute">
            For {c.company || c.name}
            {doc.eventType ? ` · ${doc.eventType}` : ""}
            {doc.eventDate ? ` · ${formatDate(doc.eventDate)}` : ""}
          </p>
        </div>
        <a href={`/api/public/doc/${token}?download=1`} className="btn-dark">
          <Download size={15} /> Download PDF
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card overflow-hidden lg:col-span-3">
          <ul className="divide-y divide-line/70">
            {doc.lines.map((l) => (
              <li key={l.id} className="flex gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{l.description}</p>
                  {l.details ? <p className="mt-0.5 text-xs text-mute">{l.details}</p> : null}
                  <p className="mt-1 text-xs text-sand">
                    {l.quantity} {l.unit !== "each" ? l.unit : ""} × {formatZAR(l.unitPrice)}
                  </p>
                </div>
                <p className="whitespace-nowrap text-sm text-ink">{formatZAR(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-line bg-paper/60 px-5 py-4 text-sm">
            {doc.discount ? (
              <div className="flex justify-between">
                <span className="text-mute">Discount</span>
                <span>-{formatZAR(doc.discount)}</span>
              </div>
            ) : null}
            {doc.vatEnabled ? (
              <div className="flex justify-between">
                <span className="text-mute">VAT {doc.vatRate}%</span>
                <span>{formatZAR(doc.vatAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-ink">Total</span>
              <span className="font-serif text-2xl font-semibold text-ink">{formatZAR(doc.total)}</span>
            </div>
            {!isQuote && doc.amountPaid > 0 ? (
              <div className="flex justify-between">
                <span className="text-mute">Paid</span>
                <span className="text-emerald-700">{formatZAR(doc.amountPaid)}</span>
              </div>
            ) : null}
          </div>
          {doc.terms ? <p className="whitespace-pre-line border-t border-line px-5 py-4 text-xs leading-relaxed text-mute">{doc.terms}</p> : null}
        </section>

        <aside className="space-y-4 lg:col-span-2">
          {isQuote ? (
            <section className="card p-5">
              {state === "sent" ? (
                <>
                  <h2 className="font-serif text-2xl font-semibold text-ink">Happy to go ahead?</h2>
                  <p className="mb-4 mt-1 text-sm text-mute">
                    Accept online and we&apos;ll send your invoice{deposit ? ` for the ${doc.depositPercent}% deposit (${formatZAR(deposit)})` : ""}.
                    {doc.dueDate ? ` Valid until ${formatDate(doc.dueDate)}.` : ""}
                  </p>
                  <AcceptForm token={token} defaultName={c.name} />
                </>
              ) : state === "accepted" || state === "converted" ? (
                <div className="text-center">
                  <p className="font-serif text-2xl font-semibold text-ink">Accepted</p>
                  <p className="mt-1 text-sm text-mute">
                    {doc.acceptedBy ? `By ${doc.acceptedBy.replace(/ \(staff\)$/, "")}` : ""}
                    {doc.acceptedAt ? ` on ${formatDate(doc.acceptedAt.toISOString())}` : ""}. Thank you.
                  </p>
                </div>
              ) : state === "expired" ? (
                <p className="text-sm text-mute">This quote has expired. Please get in touch and we&apos;ll update it for you.</p>
              ) : (
                <p className="text-sm text-mute">This quote is no longer open. Please get in touch with us.</p>
              )}
            </section>
          ) : doc.status === "void" ? (
            <section className="card p-5 text-sm text-mute">This invoice has been cancelled.</section>
          ) : balance <= 0 ? (
            <section className="rounded-xl bg-emerald-600 p-5 text-center text-white">
              <p className="font-serif text-2xl font-semibold">Paid in full</p>
              <p className="text-sm text-white/80">Thank you.</p>
            </section>
          ) : (
            <section className="card p-5">
              <p className="label">{deposit > doc.amountPaid ? `Deposit due now (${doc.depositPercent}%)` : "Amount due"}</p>
              <p className="font-serif text-4xl font-semibold text-brand">{formatZAR(dueNow)}</p>
              {doc.dueDate ? <p className="mt-1 text-sm text-mute">by {formatDate(doc.dueDate)}</p> : null}
              {st.accountNumber ? (
                <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                  {[
                    ["Bank", st.bankName],
                    ["Account name", st.accountName || st.legalName || st.businessName],
                    ["Account no.", st.accountNumber],
                    ["Branch code", st.branchCode],
                    ["Reference", doc.number],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-mute">{k}</dt>
                        <dd className={`text-right ${k === "Reference" ? "font-semibold text-ink" : "text-ink"}`}>{v}</dd>
                      </div>
                    ))}
                </dl>
              ) : null}
            </section>
          )}
        </aside>
      </div>
    </PublicShell>
  );
}
