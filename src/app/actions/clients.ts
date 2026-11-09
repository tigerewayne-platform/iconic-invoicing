"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, documents } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

function readClient(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  return {
    name: s("name"),
    company: s("company"),
    email: s("email"),
    phone: s("phone"),
    vatNumber: s("vatNumber"),
    address: s("address"),
    notes: s("notes"),
  };
}

export async function saveClient(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const id = Number(fd.get("id") || 0);
  const data = readClient(fd);
  if (!data.name) return { error: "Client name is required." };
  let clientId = id;
  if (id) await db.update(clients).set(data).where(eq(clients.id, id));
  else clientId = (await db.insert(clients).values(data).returning())[0].id;
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(fd: FormData) {
  await requireUser();
  const id = Number(fd.get("id"));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(documents)
    .where(eq(documents.clientId, id));
  if (n > 0) redirect(`/clients/${id}?error=has-documents`);
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  redirect("/clients");
}
