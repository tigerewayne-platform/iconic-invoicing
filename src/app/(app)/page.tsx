import Link from "next/link";
import { Plus } from "lucide-react";
import { dashboardStats, displayStatus, listDocuments, upcomingEvents } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { PageHeader, Stat, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";

function rands(c: number) {
  return formatZAR(c).replace(/\.\d\d$/, "");
}

export default async function Dashboard() {
  const user = await requireUser();
  const [stats, events, invoices, quotes] = await Promise.all([
    dashboardStats(),
    upcomingEvents(),
    listDocuments("invoice"),
    listDocuments("quote"),
  ]);
  const attention = [
    ...invoices.filter((r) => r.state === "overdue"),
    ...quotes.filter((r) => r.state === "accepted"),
    ...invoices.filter((r) => r.state === "draft"),
    ...quotes.filter((r) => r.state === "draft"),
  ].slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${user.name.split(" ")[0]}`}
        actions={
          <>
            <Link href="/quotes/new" className="btn-primary">
              <Plus size={16} /> New quote
            </Link>
            <Link href="/invoices/new" className="btn-ghost">
              New invoice
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Outstanding" value={rands(stats.outstanding)} sub="Unpaid on sent invoices" />
        <Stat
          label="Overdue"
          value={rands(stats.overdue)}
          sub={`${stats.overdue_count} invoice${stats.overdue_count === 1 ? "" : "s"} past due`}
          tone={stats.overdue > 0 ? "red" : undefined}
        />
        <Stat label="Open quotes" value={stats.open_quotes} sub={`${rands(stats.open_quotes_value)} waiting on clients`} />
        <Stat label="Received this month" value={rands(stats.received_month)} sub={`${rands(stats.invoiced_month)} invoiced`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-semibold text-ink">Needs attention</h2>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-mute">Nothing waiting on you. Nice.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {attention.map(({ doc, client }) => {
                const st = displayStatus(doc);
                const hint =
                  st === "overdue"
                    ? `Due ${formatDate(doc.dueDate)}, chase payment`
                    : st === "accepted"
                      ? "Accepted, ready to invoice"
                      : "Draft, not sent yet";
                return (
                  <li key={doc.id}>
                    <Link
                      href={`/${doc.type === "quote" ? "quotes" : "invoices"}/${doc.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-paper"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {client.company || client.name}{" "}
                          <span className="font-normal text-mute">· {doc.number}</span>
                        </p>
                        <p className="text-xs text-mute">{hint}</p>
                      </div>
                      <span className="text-sm text-ink">{formatZAR(doc.total - doc.amountPaid)}</span>
                      <StatusBadge status={st} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-semibold text-ink">Upcoming events</h2>
          </div>
          {events.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-mute">No confirmed events with dates yet.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {events.map(({ doc, client }) => {
                const d = new Date(doc.eventDate + "T00:00:00Z");
                const paidUp = doc.type === "invoice" && doc.amountPaid >= doc.total;
                return (
                  <li key={doc.id}>
                    <Link
                      href={`/${doc.type === "quote" ? "quotes" : "invoices"}/${doc.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-paper"
                    >
                      <div className="w-11 shrink-0 rounded-md bg-ink py-1.5 text-center text-cream">
                        <p className="text-[9px] uppercase tracking-widest text-brand">
                          {d.toLocaleString("en-ZA", { month: "short", timeZone: "UTC" })}
                        </p>
                        <p className="font-serif text-lg font-semibold leading-none">{d.getUTCDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{client.company || client.name}</p>
                        <p className="truncate text-xs text-mute">{[doc.eventType, doc.venue].filter(Boolean).join(" · ") || doc.number}</p>
                      </div>
                      <span className={`text-[11px] ${paidUp ? "text-emerald-700" : "text-mute"}`}>
                        {paidUp ? "Paid" : doc.type === "quote" ? "Not invoiced" : `${formatZAR(doc.total - doc.amountPaid)} due`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
