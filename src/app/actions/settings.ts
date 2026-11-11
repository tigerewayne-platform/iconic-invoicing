"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { getSession, requireAdmin, requireUser, startSession, wholeSecondNow } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const n = (k: string, d: number) => {
    const v = Number(fd.get(k));
    return Number.isFinite(v) && fd.get(k) !== "" ? v : d;
  };
  const vatRegistered = fd.get("vatRegistered") === "on";
  if (vatRegistered && !s("vatNumber")) return { error: "Add your VAT number, it must appear on tax invoices." };
  await db
    .update(settings)
    .set({
      businessName: s("businessName") || "Iconic Stretch Tents",
      legalName: s("legalName"),
      regNumber: s("regNumber"),
      vatRegistered,
      vatNumber: s("vatNumber"),
      vatRate: n("vatRate", 15),
      address: s("address"),
      phone: s("phone"),
      email: s("email"),
      website: s("website"),
      bankName: s("bankName"),
      accountName: s("accountName"),
      accountNumber: s("accountNumber"),
      branchCode: s("branchCode"),
      accountType: s("accountType"),
      quotePrefix: s("quotePrefix") || "Q",
      invoicePrefix: s("invoicePrefix") || "INV",
      receiptPrefix: s("receiptPrefix") || "RCT",
      nextQuoteNo: n("nextQuoteNo", 1001),
      nextInvoiceNo: n("nextInvoiceNo", 1001),
      nextReceiptNo: n("nextReceiptNo", 1001),
      quoteValidityDays: n("quoteValidityDays", 14),
      paymentTermsDays: n("paymentTermsDays", 7),
      depositPercent: n("depositPercent", 50),
      quoteTerms: s("quoteTerms"),
      invoiceTerms: s("invoiceTerms"),
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1));
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}

export async function addUser(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "admin" ? "admin" : "staff";
  if (!name || !email.includes("@")) return { error: "Enter a name and email." };
  if (password.length < 8) return { error: "Temporary password must be 8+ characters." };
  const [exists] = await db.select().from(users).where(eq(users.email, email));
  if (exists) return { error: "Someone already uses that email." };
  await db.insert(users).values({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
  revalidatePath("/settings");
  return { ok: `${name} can now sign in.` };
}

export async function removeUser(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) return;
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/settings");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await bcrypt.compare(current, me.passwordHash))) return { error: "Current password is wrong." };
  if (next.length < 8) return { error: "New password must be 8+ characters." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10), passwordChangedAt: wholeSecondNow() }).where(eq(users.id, me.id));
  // Other devices are signed out; keep this one signed in with a fresh session.
  await startSession(me, Boolean((await getSession())?.rem));
  return { ok: "Password changed. Other devices have been signed out." };
}
