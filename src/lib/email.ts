import "server-only";
import { Resend } from "resend";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function appUrl() {
  return (process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
}

export async function sendEmail(opts: {
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  text: string;
  attachment: { filename: string; content: Buffer };
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
    attachments: [{ filename: opts.attachment.filename, content: opts.attachment.content }],
  });
  if (error) throw new Error(error.message);
}
