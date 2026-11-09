import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/db";
import { clients, documents } from "@/db/schema";
import { deleteClient } from "@/app/actions/clients";
import { displayStatus } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { ConfirmButton } from "@/components/forms";
import { PageHeader, Stat, StatusBadge } from "@/components/ui";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const id = Number((await params).id);
  const [c] = await db.select().from(clients).where(eq(clients.id, id));
  if (!c) notFound();
  const { error } = await searchParams;
  const docs = await db.select().from(documents).where(eq(documents.clientId, id)).orderBy(desc(documents.issueDate), desc(documents.id));
  const invoices = docs.filter((d) => d.type === "invoice" && d.status !== "void");
  const billed = invoices.reduce((a, d) => a + d.total, 0);
  const paid = invoices.reduce((a, d) => a + d.amountPaid, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/clients", label: "Clients" }}
        eyebrow="Client"
        title={c.company || c.name}
        actions={
          <>
            <Link href={`/quotes/new?client=${c.id}`} className="btn-primary">
              <Plus size={15} /> Quote
            </Link>
            <Link href={`/invoices/new?client=${c.id}`} className="btn-ghost">
              <Plus size={15} /> Invoice
            </Link>
            <Link href={`/clients/${c.id}/edit`} className="btn-ghost">
              <Pencil size={15} /> Edit
            </Link>
          </>
        }
      />
      {error === "has-documents" ? (
        <p className="mb-4 rounded-md bg-brand/5 px-3 py-2 text-sm text-brand ring-1 ring-brand/20">
          This client has quotes or invoices, so it can&apos;t be deleted.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card space-y-3 p-5 text-sm">
          {c.company ? <p className="font-medium text-ink">{c.name}</p> : null}
          {c.email ? (
            <a href={`mailto:${c.email}`} className="block text-mute hover:text-brand">
              {c.email}
            </a>
          ) : null}
          {c.phone ? (
            <a href={`tel:${c.phone}`} className="block text-mute hover:text-brand">
              {c.phone}
            </a>
          ) : null}
          {c.address ? <p className="whitespace-pre-line text-mute">{c.address}</p> : null}
          {c.vatNumber ? <p className="text-mute">VAT {c.vatNumber}</p> : null}
          {c.notes ? <p className="rounded-md bg-paper p-3 text-xs text-mute">{c.notes}</p> : null}
          {docs.length === 0 ? (
            <form action={deleteClient} className="pt-2">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton className="btn-quiet px-0 text-xs hover:text-brand" message="Delete this client?">
                Delete client
              </ConfirmButton>
            </form>
          ) : null}
        </section>
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Billed" value={formatZAR(billed).replace(/\.\d\d$/, "")} />
            <Stat label="Paid" value={formatZAR(paid).replace(/\.\d\d$/, "")} />
            <Stat label="Owing" value={formatZAR(billed - paid).replace(/\.\d\d$/, "")} tone={billed - paid > 0 ? "red" : undefined} />
          </div>
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-serif text-xl font-semibold text-ink">History</h2>
            {docs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-mute">No quotes or invoices yet.</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {docs.map((d) => (
                  <li key={d.id}>
                    <Link href={`/${d.type === "quote" ? "quotes" : "invoices"}/${d.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-paper">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {d.number} <span className="font-normal text-mute">· {d.type === "quote" ? "Quote" : "Invoice"}</span>
                        </p>
                        <p className="truncate text-xs text-mute">
                          {formatDate(d.issueDate)}
                          {d.eventType ? ` · ${d.eventType}` : ""}
                          {d.venue ? ` · ${d.venue}` : ""}
                        </p>
                      </div>
                      <span className="text-sm text-ink">{formatZAR(d.total)}</span>
                      <StatusBadge status={displayStatus(d)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
