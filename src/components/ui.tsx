import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-block text-xs text-mute hover:text-ink">
            ← {back.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h1 className="truncate font-serif text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-line/60 text-mute" },
  sent: { label: "Sent", cls: "bg-sky-50 text-sky-800 ring-1 ring-sky-200" },
  accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" },
  declined: { label: "Declined", cls: "bg-zinc-100 text-zinc-500 line-through" },
  expired: { label: "Expired", cls: "bg-amber-50 text-amber-800 ring-1 ring-amber-200" },
  converted: { label: "Invoiced", cls: "bg-ink text-cream" },
  partially_paid: { label: "Part paid", cls: "bg-amber-50 text-amber-800 ring-1 ring-amber-200" },
  paid: { label: "Paid", cls: "bg-emerald-600 text-white" },
  overdue: { label: "Overdue", cls: "bg-brand text-white" },
  void: { label: "Void", cls: "bg-zinc-100 text-zinc-400 line-through" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-line text-mute" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium tracking-normal align-middle ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "red" }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className={`font-serif text-3xl font-semibold ${tone === "red" ? "text-brand" : "text-ink"}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-mute">{sub}</p> : null}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <p className="font-serif text-2xl font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-mute">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
