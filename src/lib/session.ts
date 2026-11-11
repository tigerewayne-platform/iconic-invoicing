import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ist_session";
/** "Remember me" keeps you signed in on this device for 30 days. */
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;
/** Without it, the cookie ends when the browser closes, and the session can't outlive 12 hours. */
const SHORT_MAX_AGE = 60 * 60 * 12;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET must be set (16+ chars)");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { uid: number; name: string; role: "admin" | "staff"; rem?: boolean; iat?: number };

export async function signSession(p: Omit<SessionPayload, "iat">) {
  return new SignJWT({ uid: p.uid, name: p.name, role: p.role, rem: Boolean(p.rem) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${p.rem ? REMEMBER_MAX_AGE : SHORT_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // No maxAge = browser-session cookie, cleared when the browser is closed.
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  };
}
