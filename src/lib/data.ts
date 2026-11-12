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
import { addDays, todayISO } from "./dates";

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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** First day of the month `offset` months from the month containing `iso`. */
function monthStartISO(iso: string, offset: number) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return d.toISOString().slice(0, 10);
}

export type MonthPoint = { key: string; label: string; year: number; value: number; count: number; extra: number };

function monthSeries(fromISO: string, months: number) {
  return Array.from({ length: months }, (_, i) => {
    const start = monthStartISO(fromISO, i);
    const [y, m] = start.split("-").map(Number);
    return { key: start.slice(0, 7), label: MONTH_LABELS[m - 1], year: y, value: 0, count: 0, extra: 0 } as MonthPoint;
  });
}

/** Payments received per month (value) and amount invoiced per month (extra), last 12 months incl. this one. */
export async function cashByMonth(): Promise<MonthPoint[]> {
  const today = todayISO();
  const from = monthStartISO(today, -11);
  const series = monthSeries(from, 12);
  const byKey = new Map(series.map((p) => [p.key, p]));
  const paid = await db.execute<{ k: string; total: number; n: number }>(sql`
    select to_char(paid_at, 'YYYY-MM') as k, sum(amount)::int as total, count(*)::int as n
    from payments where paid_at >= ${from} group by 1`);
  for (const r of paid) {
    const p = byKey.get(r.k);
    if (p) { p.value = r.total; p.count = r.n; }
  }
  const invoiced = await db.execute<{ k: string; total: number }>(sql`
    select to_char(issue_date, 'YYYY-MM') as k, sum(total)::int as total
    from documents where type = 'invoice' and status not in ('draft', 'void') and issue_date >= ${from} group by 1`);
  for (const r of invoiced) {
    const p = byKey.get(r.k);
    if (p) p.extra = r.total;
  }
  return series;
}

/**
 * Confirmed work by event month for this month and the next 5: live invoices plus accepted
 * quotes that haven't been invoiced yet (converted quotes are counted through their invoice).
 * value = total booked, extra = still unpaid on those bookings, count = number of events.
 */
export async function bookedByEventMonth(): Promise<MonthPoint[]> {
  const today = todayISO();
  const from = monthStartISO(today, 0);
  const to = monthStartISO(today, 6);
  const series = monthSeries(from, 6);
  const byKey = new Map(series.map((p) => [p.key, p]));
  const rows = await db.execute<{ k: string; total: number; unpaid: number; n: number }>(sql`
    select to_char(event_date, 'YYYY-MM') as k,
           sum(total)::int as total,
           sum(greatest(total - amount_paid, 0))::int as unpaid,
           count(*)::int as n
    from documents
    where event_date >= ${from} and event_date < ${to}
      and ((type = 'invoice' and status not in ('draft', 'void')) or (type = 'quote' and status = 'accepted'))
    group by 1`);
  for (const r of rows) {
    const p = byKey.get(r.k);
    if (p) { p.value = r.total; p.extra = r.unpaid; p.count = r.n; }
  }
  return series;
}

export type AgingBucket = { key: string; label: string; value: number; count: number };

/** Unpaid balance on sent invoices, grouped by how late it is. */
export async function receivablesAging(): Promise<AgingBucket[]> {
  const today = todayISO();
  const [r] = await db.execute<Record<string, number>>(sql`
    with o as (
      select total - amount_paid as owed, (${today}::date - due_date) as late
      from documents where type = 'invoice' and status in ('sent', 'partially_paid') and total > amount_paid
    )
    select
      coalesce(sum(owed) filter (where late is null or late <= 0), 0)::int as current_v,
      count(*) filter (where late is null or late <= 0)::int as current_n,
      coalesce(sum(owed) filter (where late between 1 and 30), 0)::int as d30_v,
      count(*) filter (where late between 1 and 30)::int as d30_n,
      coalesce(sum(owed) filter (where late between 31 and 60), 0)::int as d60_v,
      count(*) filter (where late between 31 and 60)::int as d60_n,
      coalesce(sum(owed) filter (where late > 60), 0)::int as d90_v,
      count(*) filter (where late > 60)::int as d90_n
    from o`);
  return [
    { key: "current", label: "Not due yet", value: r.current_v, count: r.current_n },
    { key: "d30", label: "1 to 30 days late", value: r.d30_v, count: r.d30_n },
    { key: "d60", label: "31 to 60 days late", value: r.d60_v, count: r.d60_n },
    { key: "d90", label: "Over 60 days late", value: r.d90_v, count: r.d90_n },
  ];
}

/** Quotes sent in the last 90 days and what happened to them. */
export async function quoteConversion() {
  const from = addDays(todayISO(), -90);
  const [r] = await db.execute<{ sent: number; won: number; won_value: number; sent_value: number }>(sql`
    select count(*)::int as sent,
           count(*) filter (where status in ('accepted', 'converted'))::int as won,
           coalesce(sum(total) filter (where status in ('accepted', 'converted')), 0)::int as won_value,
           coalesce(sum(total), 0)::int as sent_value
    from documents where type = 'quote' and status <> 'draft' and issue_date >= ${from}`);
  return r;
}
