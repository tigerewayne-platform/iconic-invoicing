import "server-only";
import { Resend } from "resend";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function appUrl() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return (process.env.APP_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}

export async function sendEmail(opts: {
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  text: string;
  attachment?: { filename: string; content: Buffer };
}) {
  if (!emailConfigured()) throw new Error("Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM.");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: opts.to.split(/[,;]\s*/).filter(Boolean),
    cc: opts.cc ? opts.cc.split(/[,;]\s*/).filter(Boolean) : undefined,
    replyTo: opts.replyTo || undefined,
    subject: opts.subject,
    text: opts.text,
    attachments: opts.attachment ? [{ filename: opts.attachment.filename, content: opts.attachment.content }] : undefined,
  });
  if (error) throw new Error(error.message);
}
