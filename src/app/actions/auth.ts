"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/session";
import { startSession, wholeSecondNow } from "@/lib/auth";
import { appUrl, emailConfigured, sendEmail } from "@/lib/email";

export type FormState = { error?: string; ok?: string } | undefined;

const RESET_TTL_MINUTES = 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function userCount() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  return n;
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const remember = fd.get("remember") === "on";
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  await startSession(u, remember);
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
  await startSession(u, true);
  redirect("/settings?welcome=1");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/**
 * Emails a one-time reset link. Always answers the same way whether or not the
 * email belongs to a user, so the form can't be used to find out who has an account.
 */
export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter the email you sign in with." };
  if (!emailConfigured()) {
    return { error: "Password reset emails aren't switched on yet. Ask an admin to reset your password in Settings." };
  }
  const done = { ok: "If that email has an account, a reset link is on its way. It works once and expires in 1 hour." };

  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u) return done;

  // Throttle: at most one link per user per minute.
  const [recent] = await db
    .select({ id: passwordResets.id })
    .from(passwordResets)
    .where(and(eq(passwordResets.userId, u.id), gt(passwordResets.createdAt, sql`now() - interval '1 minute'`)));
  if (recent) return done;

  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({
    userId: u.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
  });

  const link = `${appUrl()}/reset-password?token=${token}`;
  try {
    await sendEmail({
      to: u.email,
      subject: "Reset your Iconic Billing password",
      text: [
        `Hi ${u.name},`,
        "",
        "Someone asked to reset the password for your Iconic Stretch Tents billing login.",
        "Use this link to choose a new one. It works once and expires in 1 hour:",
        "",
        link,
        "",
        "If you didn't ask for this, ignore this email. Your password stays the same.",
      ].join("\n"),
    });
  } catch (e) {
    console.error("[password-reset] email failed", e);
    return { error: "We couldn't send the email just now. Try again in a minute." };
  }
  return done;
}

/** Finds a reset row that is unused and not expired. */
async function findValidReset(token: string) {
  if (!token) return null;
  const [r] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    );
  return r ?? null;
}

export async function resetTokenIsValid(token: string) {
  return Boolean(await findValidReset(token));
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const r = await findValidReset(token);
  if (!r) return { error: "This reset link has expired or was already used. Request a new one." };

  // Claim the token atomically so a double submit can't use it twice.
  const claimed = await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.id, r.id), isNull(passwordResets.usedAt)))
    .returning({ id: passwordResets.id });
  if (claimed.length === 0) return { error: "This reset link was already used. Request a new one." };

  const [u] = await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: wholeSecondNow() })
    .where(eq(users.id, r.userId))
    .returning();
  // Any other outstanding links for this user stop working too.
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.userId, r.userId), isNull(passwordResets.usedAt)));

  await startSession(u, false);
  redirect("/");
}
