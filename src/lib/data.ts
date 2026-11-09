import "server-only";
import { randomBytes } from "crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activity,
  catalogItems,
  clients,
  documentLines,
  documents,
  payments,
  settings,
  type Document,
} from "@/db/schema";
import { DEFAULT_INVOICE_TERMS, DEFAULT_QUOTE_TERMS } from "./defaults";
import { todayISO } from "./dates";

export function newToken() {
  return randomBytes(18).toString("base64url");
}

export async function getSettings() {
  const [s] = await db.select().from(settings).where(eq(settings.id, 1));
  if (s) return s;
  const [created] = await db
    .insert(settings)
    .values({ id: 1, quoteTerms: DEFAULT_QUOTE_TERMS, invoiceTerms: DEFAULT_INVOICE_TERMS })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(settings).where(eq(settings.id, 1)))[0];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Atomically take the next number for a document type. */
export async function nextNumber(tx: Tx, kind: "quote" | "invoice" | "receipt") {
  const col =
    kind === "quote" ? "next_quote_no" : kind === "invoice" ? "next_invoice_no" : "next_receipt_no";
  const prefixCol =
    kind === "quote" ? "quote_prefix" : kind === "invoice" ? "invoice_prefix" : "receipt_prefix";
  const rows = await tx.execute<{ n: number; prefix: string }>(
    sql.raw(`UPDATE settings SET ${col} = ${col} + 1 WHERE id = 1 RETURNING ${col} - 1 AS n, ${prefixCol} AS prefix`),
  );
  const r = rows[0];
  return `${r.prefix}-${r.n}`;
}

export async function logActivity(documentId: number | null, message: string, userName = "") {
  await db.insert(activity).values({ documentId, message, userName });
}

export async function getDocument(id: number) {
  return db.query.documents.findFirst({
    where: eq(documents.id, id),
    with: {
      client: true,
      lines: { orderBy: [asc(documentLines.position)] },
      payments: { orderBy: [asc(payments.paidAt), asc(payments.id)] },
      activity: { orderBy: [desc(activity.createdAt)] },
    },
  });
}
export type FullDocument = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export async function getDocumentByToken(token: string) {
  const d = await db.query.documents.findFirst({ where: eq(documents.publicToken, token) });
  return d ? getDocument(d.id) : undefined;
}

export async function getPayment(id: number) {
  return db.query.payments.findFirst({
    where: eq(payments.id, id),
    with: { invoice: { with: { client: true, payments: true } } },
  });
}
export type FullPayment = NonNullable<Awaited<ReturnType<typeof getPayment>>>;

export async function listDocuments(type: "quote" | "invoice", status?: string, q?: string) {
  const rows = await db
    .select({ doc: documents, client: clients })
    .from(documents)
    .innerJoin(clients, eq(clients.id, documents.clientId))
    .where(
      and(
        eq(documents.type, type),
        q
          ? sql`(${documents.number} ilike ${"%" + q + "%"} or ${clients.name} ilike ${"%" + q + "%"} or ${clients.company} ilike ${"%" + q + "%"} or ${documents.venue} ilike ${"%" + q + "%"})`
          : undefined,
      ),
    )
    .orderBy(desc(documents.issueDate), desc(documents.id));
  const withState = rows.map((r) => ({ ...r, state: displayStatus(r.doc) }));
  return status ? withState.filter((r) => r.state === status) : withState;
}

/** Status shown in the UI: adds computed "overdue" and "expired". */
export function displayStatus(d: Pick<Document, "type" | "status" | "dueDate" | "total" | "amountPaid">) {
  const today = todayISO();
  if (d.type === "quote") {
    if (d.status === "sent" && d.dueDate && d.dueDate < today) return "expired";
    return d.status;
  }
  if (["sent", "partially_paid"].includes(d.status) && d.dueDate && d.dueDate < today) return "overdue";
  return d.status;
}

export async function listClients(q?: string) {
  const rows = await db
    .select({
      client: clients,
      docCount: sql<number>`(select count(*)::int from documents d where d.client_id = ${clients.id})`,
      outstanding: sql<number>`coalesce((select sum(d.total - d.amount_paid)::int from documents d where d.client_id = ${clients.id} and d.type = 'invoice' and d.status in ('sent','partially_paid')), 0)`,
    })
    .from(clients)
    .where(
      q
        ? sql`(${clients.name} ilike ${"%" + q + "%"} or ${clients.company} ilike ${"%" + q + "%"} or ${clients.email} ilike ${"%" + q + "%"} or ${clients.phone} ilike ${"%" + q + "%"})`
        : undefined,
    )
    .orderBy(asc(clients.name));
  return rows;
}

export async function listCatalog(activeOnly = false) {
  return db
    .select()
    .from(catalogItems)
    .where(activeOnly ? eq(catalogItems.active, true) : undefined)
    .orderBy(asc(catalogItems.sortOrder), asc(catalogItems.id));
}

export async function dashboardStats() {
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";
  const [r] = await db.execute<{
    outstanding: number;
    overdue: number;
    overdue_count: number;
    open_quotes: number;
    open_quotes_value: number;
    received_month: number;
    invoiced_month: number;
    accepted_month: number;
  }>(sql`
    select
      coalesce((select sum(total - amount_paid) from documents where type='invoice' and status in ('sent','partially_paid')),0)::int as outstanding,
      coalesce((select sum(total - amount_paid) from documents where type='invoice' and status in ('sent','partially_paid') and due_date < ${today}),0)::int as overdue,
      (select count(*) from documents where type='invoice' and status in ('sent','partially_paid') and due_date < ${today})::int as overdue_count,
      (select count(*) from documents where type='quote' and status = 'sent' and (due_date is null or due_date >= ${today}))::int as open_quotes,
      coalesce((select sum(total) from documents where type='quote' and status = 'sent' and (due_date is null or due_date >= ${today})),0)::int as open_quotes_value,
      coalesce((select sum(amount) from payments where paid_at >= ${monthStart}),0)::int as received_month,
      coalesce((select sum(total) from documents where type='invoice' and status <> 'void' and status <> 'draft' and issue_date >= ${monthStart}),0)::int as invoiced_month,
      (select count(*) from documents where type='quote' and accepted_at >= ${monthStart}::date)::int as accepted_month
  `);
  return r;
}

export async function upcomingEvents() {
  const today = todayISO();
  return db
    .select({ doc: documents, client: clients })
    .from(documents)
    .innerJoin(clients, eq(clients.id, documents.clientId))
    .where(
      and(
        sql`${documents.eventDate} >= ${today}`,
        sql`((${documents.type} = 'invoice' and ${documents.status} <> 'void') or (${documents.type} = 'quote' and ${documents.status} = 'accepted'))`,
      ),
    )
    .orderBy(asc(documents.eventDate))
    .limit(8);
}
