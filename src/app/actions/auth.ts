"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export type FormState = { error?: string; ok?: string } | undefined;

async function startSession(u: { id: number; name: string; role: "admin" | "staff" }) {
  const token = await signSession({ uid: u.id, name: u.name, role: u.role });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function userCount() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  return n;
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  await startSession(u);
  const next = String(fd.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function setupFirstUser(_: FormState, fd: FormData): Promise<FormState> {
  if ((await userCount()) > 0) return { error: "Setup is already done. Sign in instead." };
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !email.includes("@")) return { error: "Enter your name and a valid email." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash: await bcrypt.hash(password, 10), role: "admin" })
    .returning();
  await startSession(u);
  redirect("/settings?welcome=1");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
