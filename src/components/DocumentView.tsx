import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { Copy, Download, Eye, Pencil } from "lucide-react";
import { convertToInvoice, deleteQuote, duplicateDocument, setStatus } from "@/app/actions/documents";
import { displayStatus, getDocument, getSettings } from "@/lib/data";
import { formatDate, todayISO } from "@/lib/dates";
import { appUrl, emailConfigured } from "@/lib/email";
import { documentMessage, whatsappLink } from "@/lib/messages";
import { centsToInput, formatZAR } from "@/lib/money";
import { documentTitle } from "@/pdf/DocumentPdf";
import { METHOD_LABEL } from "@/pdf/ReceiptPdf";
import { ConfirmButton, SubmitButton } from "./forms";
import { PageHeader, StatusBadge } from "./ui";
import { PaymentForm } from "./PaymentForm";
import { SendPanel } from "./SendPanel";

function StatusButton({ id, status, label, className = "btn-ghost" }: { id: number; status: string; label: string; className?: string }) {
  return (
    <form action={setStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className} pendingText="…">
        {label}
      </SubmitButton>
    </form>
  );
}

export async function DocumentView({ id, type }: { id: number; type: "quote" | "invoice" }) {
  const [doc, st] = await Promise.all([getDocument(id), getSettings()]);
  if (!doc || doc.type !== type) notFound();
  const isQuote = type === "quote";
  const base = isQuote ? "/quotes" : "/invoices";
  const state = displayStatus(doc);
  const balance = doc.total - doc.amountPaid;
  const deposit = doc.depositPercent > 0 ? Math.round((doc.total * doc.depositPercent) / 100) : 0;
  const editable = isQuote ? doc.status !== "converted" : doc.status !== "void" && doc.amountPaid === 0;
  const link = `${appUrl()}/p/${doc.publicToken}`;
  const msg = documentMessage(doc, st, link);
  const c = doc.client;
  const title = documentTitle(type, st, doc.vatEnabled);

  let linked: { id: number; number: string } | null = null;
  if (doc.sourceQuoteId) {
    const q = await getDocument(doc.sourceQuoteId);
    if (q) linked = { id: q.id, number: q.number };
  }

  const suggested: { label: string; amount: string }[] = [];
  if (!isQuote && balance > 0) {
    if (deposit > doc.amountPaid && deposit < doc.total) suggested.push({ label: `Deposit ${doc.depositPercent}%`, amount: centsToInput(deposit - doc.amountPaid) });
    suggested.push({ label: "Full balance", amount: centsToInput(balance) });
  }

  return (
    <>
      <PageHeader
        back={{ href: base, label: isQuote ? "Quotes" : "Invoices" }}
        eyebrow={title.toLowerCase().replace(/^\w/, (x) => x.toUpperCase())}
        title={
          <span className="flex items-center gap-3">
            {doc.number} <StatusBadge status={state} />
          </span>
        }
        actions={
          <>
            <a href={`/api/pdf/doc/${doc.id}`} target="_blank" className="btn-ghost">
              <Eye size={15} /> View PDF
            </a>
            <a href={`/api/pdf/doc/${doc.id}?download=1`} className="btn-ghost">
              <Download size={15} /> Download
            </a>
            {editable ? (
              <Link href={`${base}/${doc.id}/edit`} className="btn-ghost">
                <Pencil size={15} /> Edit
              </Link>
            ) : null}
            <form action={duplicateDocument}>
              <input type="hidden" name="id" value={doc.id} />
              <SubmitButton className="btn-ghost" pendingText="…">
                <Copy size={15} /> Duplicate
              </SubmitButton>
            </form>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Summary */}
          <section className="card overflow-hidden">
            <div className="grid gap-6 border-b border-line p-5 sm:grid-cols-3">
              <div>
                <p className="label">{isQuote ? "Prepared for" : "Bill to"}</p>
                <Link href={`/clients/${c.id}`} className="font-medium text-ink hover:text-brand">
                  {c.company || c.name}
                </Link>
                {c.company ? <p className="text-sm text-mute">{c.name}</p> : null}
                {c.email ? <p className="text-sm text-mute">{c.email}</p> : null}
                {c.phone ? <p className="text-sm text-mute">{c.phone}</p> : null}
              </div>
              <div>
                <p className="label">Event</p>
                <p className="text-ink">{doc.eventType || "—"}</p>
                {doc.eventDate ? <p className="text-sm text-mute">{formatDate(doc.eventDate)}</p> : null}
                {doc.venue ? <p className="text-sm text-mute">{doc.venue}</p> : null}
              </div>
              <div>
                <p className="label">Dates</p>
                <p className="text-sm text-ink">Issued {formatDate(doc.issueDate)}</p>
                {doc.dueDate ? (
                  <p className={`text-sm ${state === "overdue" || state === "expired" ? "text-brand" : "text-mute"}`}>
                    {isQuote ? "Valid until" : "Due"} {formatDate(doc.dueDate)}
                  </p>
                ) : null}
                {linked ? (
                  <p className="mt-1 text-sm text-mute">
                    From quote{" "}
                    <Link href={`/quotes/${linked.id}`} className="text-brand hover:underline">
                      {linked.number}
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="min-w-[14rem]">
                        <p className="font-medium text-ink">{l.description}</p>
                        {l.details ? <p className="mt-0.5 text-xs text-mute">{l.details}</p> : null}
                      </td>
                      <td className="whitespace-nowrap text-right text-mute">
                        {l.quantity} {l.unit !== "each" ? l.unit : ""}
                      </td>
                      <td className="whitespace-nowrap text-right text-mute">{formatZAR(l.unitPrice)}</td>
                      <td className="whitespace-nowrap text-right text-ink">{formatZAR(l.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-line bg-paper/60 p-5">
              <dl className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-mute">Subtotal</dt>
                  <dd>{formatZAR(doc.subtotal)}</dd>
                </div>
                {doc.discount ? (
                  <div className="flex justify-between">
                    <dt className="text-mute">Discount</dt>
                    <dd>-{formatZAR(doc.discount)}</dd>
                  </div>
                ) : null}
                {doc.vatEnabled ? (
                  <div className="flex justify-between">
                    <dt className="text-mute">VAT {doc.vatRate}%</dt>
                    <dd>{formatZAR(doc.vatAmount)}</dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-line pt-2">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="font-serif text-2xl font-semibold text-ink">{formatZAR(doc.total)}</dd>
                </div>
                {!isQuote && doc.amountPaid > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-mute">Paid</dt>
                      <dd className="text-emerald-700">-{formatZAR(doc.amountPaid)}</dd>
                    </div>
                    <div className="flex justify-between font-medium">
                      <dt className="text-ink">Balance</dt>
                      <dd className={balance > 0 ? "text-brand" : "text-emerald-700"}>{formatZAR(balance)}</dd>
                    </div>
                  </>
                ) : null}
                {deposit > 0 && doc.amountPaid < deposit ? (
                  <p className="pt-1 text-right text-xs text-mute">
                    {doc.depositPercent}% deposit: {formatZAR(deposit)}
                  </p>
                ) : null}
              </dl>
            </div>
          </section>

          {!isQuote && doc.payments.length ? (
            <section className="card">
              <h3 className="border-b border-line px-5 py-4 font-serif text-lg font-semibold text-ink">Payments & receipts</h3>
              <ul className="divide-y divide-line/70">
                {doc.payments.map((p) => (
                  <li key={p.id}>
                    <Link href={`/receipts/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-paper">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{p.receiptNumber}</p>
                        <p className="text-xs text-mute">
                          {formatDate(p.paidAt)} · {METHOD_LABEL[p.method]}
                          {p.reference ? ` · ${p.reference}` : ""}
                        </p>
                      </div>
                      <span className="text-sm text-emerald-700">{formatZAR(p.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {doc.activity.length ? (
            <section className="px-1">
              <p className="label">History</p>
              <ul className="space-y-1.5 text-xs text-mute">
                {doc.activity.map((a) => (
                  <li key={a.id}>
                    <span className="text-ink">{a.message}</span>
                    {a.userName ? ` · ${a.userName}` : ""} ·{" "}
                    {a.createdAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" })}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Side panel */}
        <div className="min-w-0 space-y-4">
          {isQuote && doc.status !== "converted" && doc.status !== "declined" ? (
            <section className={`card p-5 ${doc.status === "accepted" ? "ring-2 ring-emerald-500/40" : ""}`}>
              <h3 className="font-serif text-lg font-semibold text-ink">
                {doc.status === "accepted" ? "Accepted, create the invoice" : "Turn into an invoice"}
              </h3>
              {doc.acceptedAt ? (
                <p className="mt-1 text-xs text-mute">
                  Accepted by {doc.acceptedBy} on {formatDate(doc.acceptedAt.toISOString())}
                </p>
              ) : (
                <p className="mt-1 text-xs text-mute">Copies every line into a new invoice and locks this quote.</p>
              )}
              <form action={convertToInvoice} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={doc.id} />
                <label className="block">
                  <span className="label">Deposit to request</span>
                  <select name="depositPercent" className="input" defaultValue={String(doc.depositPercent)}>
                    <option value="0">None, full amount due</option>
                    {[25, 30, 40, 50, 60, 70].map((p) => (
                      <option key={p} value={p}>
                        {p}% deposit ({formatZAR(Math.round((doc.total * p) / 100))})
                      </option>
                    ))}
                    {![0, 25, 30, 40, 50, 60, 70].includes(doc.depositPercent) ? (
                      <option value={doc.depositPercent}>{doc.depositPercent}% deposit</option>
                    ) : null}
                  </select>
                </label>
                <SubmitButton className="btn-primary w-full" pendingText="Creating invoice…">
                  Convert to invoice
                </SubmitButton>
              </form>
            </section>
          ) : null}

          {doc.status === "converted" ? (
            <ConvertedLink quoteId={doc.id} />
          ) : null}

          {!isQuote && doc.status !== "void" && balance > 0 ? (
            <section className="card p-5">
              <h3 className="mb-3 font-serif text-lg font-semibold text-ink">Record a payment</h3>
              <PaymentForm invoiceId={doc.id} suggested={suggested} today={todayISO()} />
            </section>
          ) : null}

          {doc.status !== "void" && doc.status !== "converted" ? (
            <SendPanel
              kind="doc"
              id={doc.id}
              to={c.email}
              subject={msg.subject}
              body={msg.text}
              link={link}
              whatsapp={c.phone ? whatsappLink(c.phone, msg.text) : null}
              emailReady={emailConfigured()}
            />
          ) : null}

          <section className="card p-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-ink">Status</h3>
            <div className="flex flex-wrap gap-2">
              {isQuote && doc.status === "draft" ? <StatusButton id={doc.id} status="sent" label="Mark as sent" /> : null}
              {isQuote && doc.status === "sent" ? (
                <>
                  <StatusButton id={doc.id} status="accepted" label="Mark accepted" />
                  <StatusButton id={doc.id} status="declined" label="Mark declined" />
                </>
              ) : null}
              {isQuote && (doc.status === "declined" || doc.status === "accepted") ? (
                <StatusButton id={doc.id} status="sent" label="Reopen" />
              ) : null}
              {!isQuote && doc.status === "draft" ? <StatusButton id={doc.id} status="sent" label="Mark as sent" /> : null}
              {!isQuote && ["draft", "sent"].includes(doc.status) && doc.amountPaid === 0 ? (
                <form action={setStatus}>
                  <input type="hidden" name="id" value={doc.id} />
                  <input type="hidden" name="status" value="void" />
                  <ConfirmButton message={`Void ${doc.number}? The number stays used and the invoice can't be edited again.`}>
                    Void invoice
                  </ConfirmButton>
                </form>
              ) : null}
              {isQuote && doc.status !== "converted" ? (
                <form action={deleteQuote}>
                  <input type="hidden" name="id" value={doc.id} />
                  <ConfirmButton message={`Delete quote ${doc.number}? This can't be undone.`}>Delete</ConfirmButton>
                </form>
              ) : null}
              {doc.status === "paid" ? <p className="text-sm text-emerald-700">Paid in full. Nothing more to do.</p> : null}
              {doc.status === "void" ? <p className="text-sm text-mute">This invoice is void.</p> : null}
            </div>
            {!isQuote && doc.amountPaid > 0 && doc.status !== "paid" ? (
              <p className="mt-3 text-xs text-mute">Invoices with payments can&apos;t be edited or voided. Delete the receipt first if a payment was captured by mistake.</p>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}

async function ConvertedLink({ quoteId }: { quoteId: number }) {
  const [inv] = await db.select().from(documents).where(eq(documents.sourceQuoteId, quoteId));
  if (!inv) return null;
  return (
    <section className="card p-5">
      <h3 className="font-serif text-lg font-semibold text-ink">Invoiced</h3>
      <p className="mt-1 text-sm text-mute">This quote became invoice {inv.number}.</p>
      <Link href={`/invoices/${inv.id}`} className="btn-dark mt-4 w-full">
        Open {inv.number}
      </Link>
    </section>
  );
}
