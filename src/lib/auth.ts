import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";

export async function getSession() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Writes a fresh session cookie for this user. */
export async function startSession(u: { id: number; name: string; role: "admin" | "staff" }, remember: boolean) {
  const token = await signSession({ uid: u.id, name: u.name, role: u.role, rem: remember });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(remember));
}

/** JWT "iat" has one-second precision, so password-change timestamps are truncated to match. */
export function wholeSecondNow() {
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  const [u] = await db.select().from(users).where(eq(users.id, s.uid));
  if (!u) redirect("/login");
  // A password change or reset signs out every session issued before it.
  if (u.passwordChangedAt && (s.iat ?? 0) < Math.floor(u.passwordChangedAt.getTime() / 1000)) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
