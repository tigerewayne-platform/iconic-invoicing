"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { catalogItems } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { parseZAR } from "@/lib/money";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveCatalogItem(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const id = Number(fd.get("id") || 0);
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const data = {
    name: s("name"),
    description: s("description"),
    category: s("category") || "Extras",
    unit: s("unit") || "each",
    unitPrice: parseZAR(s("unitPrice")),
    active: fd.get("active") === "on",
  };
  if (!data.name) return { error: "Name is required." };
  if (id) await db.update(catalogItems).set(data).where(eq(catalogItems.id, id));
  else {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(sort_order),0)::int` })
      .from(catalogItems);
    await db.insert(catalogItems).values({ ...data, sortOrder: max + 1 });
  }
  revalidatePath("/catalogue");
  return { ok: id ? "Saved." : "Added." };
}

export async function deleteCatalogItem(fd: FormData) {
  await requireUser();
  await db.delete(catalogItems).where(eq(catalogItems.id, Number(fd.get("id"))));
  revalidatePath("/catalogue");
}
