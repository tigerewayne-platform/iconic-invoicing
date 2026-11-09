"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { emailDocument, emailReceipt, markShared } from "@/app/actions/send";
import { FormMessage, SubmitButton } from "./forms";

export function SendPanel({
  kind,
  id,
  to,
  subject,
  body,
  link,
  whatsapp,
  emailReady,
}: {
  kind: "doc" | "receipt";
  id: number;
  to: string;
  subject: string;
  body: string;
  link: string;
  whatsapp: string | null;
  emailReady: boolean;
}) {
  const [state, action] = useActionState(kind === "doc" ? emailDocument : emailReceipt, undefined);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const record = (via: string) => {
    if (kind !== "doc") return;
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("via", via);
    void markShared(fd);
  };

  return (
    <section className="card p-5">
      <h3 className="mb-3 font-serif text-lg font-semibold text-ink">Send to client</h3>
      <div className="grid grid-cols-1 gap-2">
        <button type="button" className="btn-dark w-full" onClick={() => setOpen((o) => !o)}>
          <Mail size={15} /> Email with PDF
        </button>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-ghost w-full" onClick={() => record("WhatsApp")}>
            <MessageCircle size={15} className="text-emerald-600" /> WhatsApp link
          </a>
        ) : null}
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            record("copied link");
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />} {copied ? "Link copied" : "Copy client link"}
        </button>
      </div>
      {open ? (
        <form action={action} className="mt-4 space-y-3 border-t border-line pt-4">
          <input type="hidden" name="id" value={id} />
          {!emailReady ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
              Email sending isn&apos;t switched on yet (needs a Resend key). Use WhatsApp or{" "}
              <a className="underline" href={`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                open in your mail app
              </a>{" "}
              and attach the PDF.
            </p>
          ) : null}
          <label className="block">
            <span className="label">To</span>
            <input name="to" className="input" defaultValue={to} required />
          </label>
          {kind === "doc" ? (
            <label className="block">
              <span className="label">CC</span>
              <input name="cc" className="input" />
            </label>
          ) : null}
          <label className="block">
            <span className="label">Subject</span>
            <input name="subject" className="input" defaultValue={subject} />
          </label>
          <label className="block">
            <span className="label">Message</span>
            <textarea name="body" className="input text-xs" rows={9} defaultValue={body} />
          </label>
          <FormMessage state={state} />
          <SubmitButton className="btn-primary w-full" pendingText="Sending…">
            Send email
          </SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
