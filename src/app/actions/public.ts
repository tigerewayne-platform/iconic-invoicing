"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getDocumentByToken, logActivity } from "@/lib/data";
import { todayISO } from "@/lib/dates";

export type FormState = { error?: string; ok?: string } | undefined;

export async function acceptQuote(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token"));
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Please type your full name to accept." };
  if (fd.get("agree") !== "on") return { error: "Please tick the box to accept the terms." };
  const doc = await getDocumentByToken(token);
  if (!doc || doc.type !== "quote") return { error: "Quote not found." };
  if (doc.status !== "sent") return { error: "This quote can no longer be accepted online. Please contact us." };
  if (doc.dueDate && doc.dueDate < todayISO()) return { error: "This quote has expired. Please contact us for an updated quote." };
  await db
    .update(documents)
    .set({ status: "accepted", acceptedAt: new Date(), acceptedBy: name, updatedAt: new Date() })
    .where(and(eq(documents.id, doc.id), eq(documents.status, "sent")));
  await logActivity(doc.id, `Accepted online by ${name}`, "Client");
  revalidatePath(`/p/${token}`);
  return { ok: "accepted" };
}
