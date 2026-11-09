"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getDocument, getPayment, getSettings, logActivity } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { documentFilename, renderDocumentPdf, renderReceiptPdf } from "@/pdf/render";

export type FormState = { error?: string; ok?: string } | undefined;

export async function emailDocument(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const doc = await getDocument(Number(fd.get("id")));
  if (!doc) return { error: "Not found." };
  const to = String(fd.get("to") ?? "").trim();
  if (!to.includes("@")) return { error: "Enter an email address." };
  const st = await getSettings();
  try {
    if (doc.status === "draft") {
      await db.update(documents).set({ status: "sent", sentAt: new Date() }).where(eq(documents.id, doc.id));
      doc.status = "sent";
    }
    const pdf = await renderDocumentPdf(doc, st);
    await sendEmail({
      to,
      cc: String(fd.get("cc") ?? "").trim(),
      replyTo: st.email,
      subject: String(fd.get("subject")),
      text: String(fd.get("body")),
      attachment: { filename: documentFilename(doc, st), content: pdf },
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await logActivity(doc.id, `Emailed to ${to}`, user.name);
  revalidatePath(`/${doc.type === "quote" ? "quotes" : "invoices"}/${doc.id}`);
  return { ok: `Sent to ${to}.` };
}

export async function emailReceipt(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await getPayment(Number(fd.get("id")));
  if (!p) return { error: "Not found." };
  const to = String(fd.get("to") ?? "").trim();
  if (!to.includes("@")) return { error: "Enter an email address." };
  const st = await getSettings();
  try {
    const pdf = await renderReceiptPdf(p, st);
    await sendEmail({
      to,
      replyTo: st.email,
      subject: String(fd.get("subject")),
      text: String(fd.get("body")),
      attachment: { filename: `iconic-stretch-tents-receipt-${p.receiptNumber}.pdf`, content: pdf },
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await logActivity(p.invoiceId, `Receipt ${p.receiptNumber} emailed to ${to}`, user.name);
  return { ok: `Sent to ${to}.` };
}

/** Marks a draft as sent when it's shared another way (WhatsApp, copy link). */
export async function markShared(fd: FormData) {
  const user = await requireUser();
  const doc = await getDocument(Number(fd.get("id")));
  if (!doc) return;
  if (doc.status === "draft") {
    await db.update(documents).set({ status: "sent", sentAt: new Date() }).where(eq(documents.id, doc.id));
  }
  await logActivity(doc.id, `Shared via ${String(fd.get("via") ?? "link")}`, user.name);
  revalidatePath(`/${doc.type === "quote" ? "quotes" : "invoices"}/${doc.id}`);
}

