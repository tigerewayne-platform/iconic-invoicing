import Link from "next/link";
import { Plus } from "lucide-react";
import {
  bookedByEventMonth,
  cashByMonth,
  dashboardStats,
  displayStatus,
  listDocuments,
  quoteConversion,
  receivablesAging,
  upcomingEvents,
} from "@/lib/data";
import { BarList, ChartCard, ColumnChart, rands } from "@/components/charts";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { PageHeader, Stat, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";


export default async function Dashboard() {
  const user = await requireUser();
  const [stats, events, invoices, quotes, cash, booked, aging, conv] = await Promise.all([
    dashboardStats(),
    upcomingEvents(),
    listDocuments("invoice"),
    listDocuments("quote"),
    cashByMonth(),
    bookedByEventMonth(),
    receivablesAging(),
    quoteConversion(),
  ]);
  const cashTotal = cash.reduce((a, p) => a + p.value, 0);
  const bestCash = cash.reduce((a, p) => (p.value > a.value ? p : a), cash[0]);
  const bookedTotal = booked.reduce((a, p) => a + p.value, 0);
  const bookedUnpaid = booked.reduce((a, p) => a + p.extra, 0);
  const owedTotal = aging.reduce((a, b) => a + b.value, 0);
  const winRate = conv.sent > 0 ? Math.round((conv.won / conv.sent) * 100) : null;
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Cash received"
          sub={`Last 12 months · ${rands(cashTotal)} in total`}
          className="lg:col-span-2"
        >
          <ColumnChart
            tableCaption="Cash received per month, last 12 months"
            columns={cash.map((p, i) => ({
              key: p.key,
              label: p.label,
              value: p.value,
              callout: i === cash.length - 1 || (p === bestCash && p.value > 0),
              title: `${p.label} ${p.year}`,
              tip: [
                `${p.count} payment${p.count === 1 ? "" : "s"}`,
                `${rands(p.extra)} invoiced`,
              ],
            }))}
          />
        </ChartCard>

        <ChartCard title="Booked events ahead" sub={`Next 6 months by event date · ${rands(bookedUnpaid)} of ${rands(bookedTotal)} still unpaid`}>
          <ColumnChart
            tableCaption="Booked event value per month, next 6 months"
            columns={booked.map((p, i) => ({
              key: p.key,
              label: p.label,
              value: p.value,
              callout: i === 0,
              title: `${p.label} ${p.year}`,
              tip: [
                `${p.count} event${p.count === 1 ? "" : "s"}`,
                `${rands(p.extra)} still unpaid`,
              ],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Money owed"
          sub={`${rands(owedTotal)} unpaid on sent invoices`}
          aside={
            <div className="text-right">
              <p className="font-serif text-2xl font-semibold leading-none text-ink">{winRate === null ? "–" : `${winRate}%`}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-mute">Quotes won, 90 days</p>
              <p className="text-[11px] text-mute">
                {conv.won} of {conv.sent} · {rands(conv.won_value)}
              </p>
            </div>
          }
        >
          <BarList
            tableCaption="Unpaid invoice balance by how late it is"
            bars={aging.map((b) => ({
              key: b.key,
              label: b.label,
              value: b.value,
              tone: b.key === "current" ? "soft" : "strong",
              note: `${b.count} invoice${b.count === 1 ? "" : "s"}`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
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
