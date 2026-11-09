"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clients, documentLines, documents, payments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { calcTotals, formatZAR, parseZAR } from "@/lib/money";
import { addDays, todayISO } from "@/lib/dates";
import { getDocument, getSettings, logActivity, newToken, nextNumber } from "@/lib/data";

export type FormState = { error?: string; ok?: string } | undefined;

const lineSchema = z.object({
  description: z.string().trim().min(1, "Every line needs a description."),
  details: z.string().default(""),
  quantity: z.coerce.number().min(0),
  unit: z.string().default("each"),
  unitPrice: z.union([z.string(), z.number()]),
});

const payloadSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["quote", "invoice"]),
  clientId: z.number().optional(),
  newClient: z
    .object({
      name: z.string(),
      company: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      address: z.string().default(""),
    })
    .optional(),
  issueDate: z.string().min(10),
  dueDate: z.string().optional().default(""),
  eventDate: z.string().optional().default(""),
  eventType: z.string().default(""),
  venue: z.string().default(""),
  reference: z.string().default(""),
  notes: z.string().default(""),
  terms: z.string().default(""),
  vatEnabled: z.boolean(),
  discount: z.union([z.string(), z.number()]).default("0"),
  depositPercent: z.coerce.number().min(0).max(100).default(0),
  lines: z.array(lineSchema).min(1, "Add at least one line item."),
});

export async function saveDocument(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  let payload: z.infer<typeof payloadSchema>;
  try {
    const parsed = payloadSchema.safeParse(JSON.parse(String(fd.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
    payload = parsed.data;
  } catch {
    return { error: "Could not read the form." };
  }

  const settings = await getSettings();
  const vatEnabled = settings.vatRegistered && payload.vatEnabled;
  const lines = payload.lines.map((l) => ({ ...l, unitPrice: parseZAR(String(l.unitPrice)) }));
  const discount = parseZAR(String(payload.discount));
  const totals = calcTotals(lines, discount, vatEnabled, settings.vatRate);

  let existing: Awaited<ReturnType<typeof getDocument>> | undefined;
  if (payload.id) {
    existing = await getDocument(payload.id);
    if (!existing) return { error: "Document not found." };
    if (existing.type === "invoice" && (existing.status === "void" || existing.amountPaid > 0)) {
      return { error: "This invoice has payments or is void, so it can't be edited." };
    }
    if (existing.type === "quote" && existing.status === "converted") {
      return { error: "This quote has already been turned into an invoice." };
    }
  }
  if (!payload.clientId && !payload.newClient?.name.trim()) return { error: "Choose or add a client." };

  const id = await db.transaction(async (tx) => {
    let clientId = payload.clientId;
    if (!clientId && payload.newClient) {
      const [c] = await tx
        .insert(clients)
        .values({ ...payload.newClient, name: payload.newClient.name.trim() })
        .returning();
      clientId = c.id;
    }
    const values = {
      clientId: clientId!,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate || null,
      eventDate: payload.eventDate || null,
      eventType: payload.eventType,
      venue: payload.venue,
      reference: payload.reference,
      notes: payload.notes,
      terms: payload.terms,
      vatEnabled,
      vatRate: settings.vatRate,
      discount,
      depositPercent: payload.depositPercent,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      updatedAt: new Date(),
    };
    let docId: number;
    if (existing) {
      await tx.update(documents).set(values).where(eq(documents.id, existing.id));
      await tx.delete(documentLines).where(eq(documentLines.documentId, existing.id));
      docId = existing.id;
    } else {
      const number = await nextNumber(tx, payload.type);
      const [d] = await tx
        .insert(documents)
        .values({
          ...values,
          type: payload.type,
          number,
          status: "draft",
          publicToken: newToken(),
          createdById: user.id,
        })
        .returning();
      docId = d.id;
    }
    await tx.insert(documentLines).values(
      lines.map((l, i) => ({
        documentId: docId,
        position: i,
        description: l.description,
        details: l.details,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        lineTotal: totals.lineTotals[i],
      })),
    );
    return docId;
  });

  await logActivity(id, existing ? "Edited" : "Created", user.name);
  const base = payload.type === "quote" ? "/quotes" : "/invoices";
  revalidatePath(base);
  redirect(`${base}/${id}`);
}

const ALLOWED: Record<string, Record<string, string[]>> = {
  quote: {
    draft: ["sent"],
    sent: ["accepted", "declined", "draft"],
    accepted: ["sent"],
    declined: ["sent"],
  },
  invoice: {
    draft: ["sent", "void"],
    sent: ["void", "draft"],
    partially_paid: [],
  },
};

export async function setStatus(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status")) as (typeof documents.$inferSelect)["status"];
  const doc = await getDocument(id);
  if (!doc) return;
  if (!ALLOWED[doc.type]?.[doc.status]?.includes(status)) return;
  if (status === "void" && doc.amountPaid > 0) return;
  await db
    .update(documents)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "sent" && !doc.sentAt ? { sentAt: new Date() } : {}),
      ...(status === "accepted" ? { acceptedAt: new Date(), acceptedBy: `${user.name} (staff)` } : {}),
    })
    .where(eq(documents.id, id));
  const label: Record<string, string> = {
    sent: "Marked as sent",
    accepted: "Marked as accepted",
    declined: "Marked as declined",
    draft: "Moved back to draft",
    void: "Voided",
  };
  await logActivity(id, label[status] ?? status, user.name);
  revalidatePath(`/${doc.type === "quote" ? "quotes" : "invoices"}/${id}`);
}

export async function convertToInvoice(fd: FormData) {
  const user = await requireUser();
  const quote = await getDocument(Number(fd.get("id")));
  if (!quote || quote.type !== "quote") return;
  if (quote.status === "converted") {
    const [inv] = await db.select().from(documents).where(eq(documents.sourceQuoteId, quote.id));
    if (inv) redirect(`/invoices/${inv.id}`);
    return;
  }
  const settings = await getSettings();
  const depositPercent = Number(fd.get("depositPercent") ?? settings.depositPercent);
  const today = todayISO();
  const invId = await db.transaction(async (tx) => {
    const number = await nextNumber(tx, "invoice");
    const [inv] = await tx
      .insert(documents)
      .values({
        type: "invoice",
        number,
        status: "draft",
        clientId: quote.clientId,
        issueDate: today,
        dueDate: addDays(today, settings.paymentTermsDays),
        eventDate: quote.eventDate,
        eventType: quote.eventType,
        venue: quote.venue,
        reference: quote.reference || quote.number,
        notes: quote.notes,
        terms: settings.invoiceTerms,
        vatEnabled: quote.vatEnabled,
        vatRate: quote.vatRate,
        discount: quote.discount,
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        total: quote.total,
        depositPercent: Math.max(0, Math.min(100, depositPercent)),
        sourceQuoteId: quote.id,
        publicToken: newToken(),
        createdById: user.id,
      })
      .returning();
    await tx.insert(documentLines).values(
      quote.lines.map(({ id: _id, documentId: _d, ...l }) => ({ ...l, documentId: inv.id })),
    );
    await tx
      .update(documents)
      .set({
        status: "converted",
        updatedAt: new Date(),
        ...(quote.acceptedAt ? {} : { acceptedAt: new Date(), acceptedBy: `${user.name} (staff)` }),
      })
      .where(eq(documents.id, quote.id));
    return inv.id;
  });
  await logActivity(quote.id, "Converted to invoice", user.name);
  await logActivity(invId, `Created from quote ${quote.number}`, user.name);
  revalidatePath("/quotes");
  revalidatePath("/invoices");
  redirect(`/invoices/${invId}`);
}

export async function duplicateDocument(fd: FormData) {
  const user = await requireUser();
  const src = await getDocument(Number(fd.get("id")));
  if (!src) return;
  const settings = await getSettings();
  const today = todayISO();
  const newId = await db.transaction(async (tx) => {
    const number = await nextNumber(tx, src.type);
    const [d] = await tx
      .insert(documents)
      .values({
        type: src.type,
        number,
        status: "draft",
        clientId: src.clientId,
        issueDate: today,
        dueDate: addDays(today, src.type === "quote" ? settings.quoteValidityDays : settings.paymentTermsDays),
        eventDate: null,
        eventType: src.eventType,
        venue: src.venue,
        notes: src.notes,
        terms: src.terms,
        vatEnabled: settings.vatRegistered && src.vatEnabled,
        vatRate: settings.vatRate,
        discount: src.discount,
        subtotal: src.subtotal,
        vatAmount: settings.vatRegistered && src.vatEnabled ? src.vatAmount : 0,
        total: settings.vatRegistered && src.vatEnabled ? src.total : src.total - src.vatAmount,
        depositPercent: src.depositPercent,
        publicToken: newToken(),
        createdById: user.id,
      })
      .returning();
    await tx
      .insert(documentLines)
      .values(src.lines.map(({ id: _i, documentId: _d, ...l }) => ({ ...l, documentId: d.id })));
    return d.id;
  });
  await logActivity(newId, `Duplicated from ${src.number}`, user.name);
  redirect(`/${src.type === "quote" ? "quotes" : "invoices"}/${newId}/edit`);
}

export async function deleteQuote(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const doc = await getDocument(id);
  if (!doc || doc.type !== "quote" || doc.status === "converted") return;
  await db.delete(documents).where(eq(documents.id, id));
  await logActivity(null, `Deleted quote ${doc.number}`, user.name);
  revalidatePath("/quotes");
  redirect("/quotes");
}

/** Recompute amount paid and status for an invoice from its payments. */
async function syncInvoicePaid(invoiceId: number) {
  const [{ paid }] = await db
    .select({ paid: sql<number>`coalesce(sum(${payments.amount}),0)::int` })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));
  const [inv] = await db.select().from(documents).where(eq(documents.id, invoiceId));
  const status =
    paid >= inv.total && inv.total > 0 ? "paid" : paid > 0 ? "partially_paid" : inv.sentAt ? "sent" : "draft";
  await db
    .update(documents)
    .set({ amountPaid: paid, status, updatedAt: new Date() })
    .where(eq(documents.id, invoiceId));
}

export async function recordPayment(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const invoiceId = Number(fd.get("invoiceId"));
  const inv = await getDocument(invoiceId);
  if (!inv || inv.type !== "invoice") return { error: "Invoice not found." };
  if (inv.status === "void") return { error: "This invoice is void." };
  const amount = parseZAR(String(fd.get("amount") ?? ""));
  if (amount <= 0) return { error: "Enter the amount received." };
  const balance = inv.total - inv.amountPaid;
  if (amount > balance) return { error: `That's more than the balance of ${formatZAR(balance)}.` };
  const method = String(fd.get("method") || "eft") as "eft" | "cash" | "card" | "snapscan" | "other";
  const paidAt = String(fd.get("paidAt") || todayISO());
  const receiptId = await db.transaction(async (tx) => {
    const receiptNumber = await nextNumber(tx, "receipt");
    const [p] = await tx
      .insert(payments)
      .values({
        receiptNumber,
        invoiceId,
        amount,
        method,
        paidAt,
        reference: String(fd.get("reference") ?? "").trim(),
        notes: String(fd.get("notes") ?? "").trim(),
        publicToken: newToken(),
        createdById: user.id,
      })
      .returning();
    if (!inv.sentAt) await tx.update(documents).set({ sentAt: new Date() }).where(eq(documents.id, invoiceId));
    return p.id;
  });
  await syncInvoicePaid(invoiceId);
  await logActivity(invoiceId, `Payment of ${formatZAR(amount)} received`, user.name);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/receipts");
  redirect(`/receipts/${receiptId}?new=1`);
}

export async function deletePayment(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const [p] = await db.select().from(payments).where(eq(payments.id, id));
  if (!p) return;
  await db.delete(payments).where(and(eq(payments.id, id)));
  await syncInvoicePaid(p.invoiceId);
  await logActivity(p.invoiceId, `Receipt ${p.receiptNumber} (${formatZAR(p.amount)}) deleted`, user.name);
  revalidatePath("/receipts");
  redirect(`/invoices/${p.invoiceId}`);
}
