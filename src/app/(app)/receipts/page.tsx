import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, documents, payments } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { METHOD_LABEL } from "@/pdf/ReceiptPdf";
import { Empty, PageHeader } from "@/components/ui";
import { Search } from "lucide-react";

export const metadata = { title: "Receipts" };

export default async function Receipts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await db
    .select({ p: payments, inv: documents, client: clients })
    .from(payments)
    .innerJoin(documents, eq(documents.id, payments.invoiceId))
    .innerJoin(clients, eq(clients.id, documents.clientId))
    .where(
      q
        ? sql`(${payments.receiptNumber} ilike ${"%" + q + "%"} or ${documents.number} ilike ${"%" + q + "%"} or ${clients.name} ilike ${"%" + q + "%"} or ${clients.company} ilike ${"%" + q + "%"})`
        : undefined,
    )
    .orderBy(desc(payments.paidAt), desc(payments.id));
  const total = rows.reduce((a, r) => a + r.p.amount, 0);

  return (
    <>
      <PageHeader eyebrow="Receipts" title="Receipts" />
      <form className="relative mb-4 md:w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand" />
        <input name="q" defaultValue={q} placeholder="Search receipt, invoice, client" className="input pl-9" />
      </form>
      {rows.length === 0 ? (
        <Empty
          title={q ? "Nothing matches" : "No receipts yet"}
          body="Receipts are created when you record a payment against an invoice."
          action={
            !q ? (
              <Link href="/invoices" className="btn-dark">
                Go to invoices
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Client</th>
                    <th className="hidden sm:table-cell">Invoice</th>
                    <th className="hidden md:table-cell">Method</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, inv, client }) => (
                    <tr key={p.id} className="row-link relative">
                      <td className="whitespace-nowrap font-medium text-ink">
                        <Link href={`/receipts/${p.id}`} className="after:absolute after:inset-0">
                          {p.receiptNumber}
                        </Link>
                        <p className="text-xs font-normal text-mute">{formatDate(p.paidAt)}</p>
                      </td>
                      <td className="max-w-[14rem] truncate">{client.company || client.name}</td>
                      <td className="hidden text-mute sm:table-cell">{inv.number}</td>
                      <td className="hidden text-mute md:table-cell">{METHOD_LABEL[p.method]}</td>
                      <td className="whitespace-nowrap text-right text-emerald-700">{formatZAR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-right text-xs text-mute">
            {rows.length} receipt{rows.length === 1 ? "" : "s"} · {formatZAR(total)} received
          </p>
        </>
      )}
    </>
  );
}
