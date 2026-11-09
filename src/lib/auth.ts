import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getSession() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  const [u] = await db.select().from(users).where(eq(users.id, s.uid));
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
