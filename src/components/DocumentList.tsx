import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listDocuments } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatZAR } from "@/lib/money";
import { Empty, PageHeader, StatusBadge } from "./ui";

const FILTERS = {
  quote: [
    ["", "All"],
    ["draft", "Draft"],
    ["sent", "Sent"],
    ["accepted", "Accepted"],
    ["converted", "Invoiced"],
    ["expired", "Expired"],
    ["declined", "Declined"],
  ],
  invoice: [
    ["", "All"],
    ["draft", "Draft"],
    ["sent", "Unpaid"],
    ["partially_paid", "Part paid"],
    ["overdue", "Overdue"],
    ["paid", "Paid"],
    ["void", "Void"],
  ],
} as const;

export async function DocumentList({ type, status, q }: { type: "quote" | "invoice"; status?: string; q?: string }) {
  const rows = await listDocuments(type, status, q);
  const base = type === "quote" ? "/quotes" : "/invoices";
  const noun = type === "quote" ? "quote" : "invoice";
  const total = rows.reduce((a, r) => a + (r.state === "void" || r.state === "declined" ? 0 : r.doc.total), 0);
  const due = rows.reduce((a, r) => a + (["sent", "partially_paid", "overdue"].includes(r.state) ? r.doc.total - r.doc.amountPaid : 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={type === "quote" ? "Quotes" : "Invoices"}
        title={type === "quote" ? "Quotes" : "Invoices"}
        actions={
          <Link href={`${base}/new`} className="btn-primary">
            <Plus size={16} /> New {noun}
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {FILTERS[type].map(([v, label]) => {
            const on = (status ?? "") === v;
            const sp = new URLSearchParams();
            if (v) sp.set("status", v);
            if (q) sp.set("q", q);
            return (
              <Link
                key={v}
                href={`${base}${sp.size ? "?" + sp : ""}`}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                  on ? "bg-ink text-cream" : "bg-white text-mute ring-1 ring-line hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <form className="relative md:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand" />
          <input name="q" defaultValue={q} placeholder="Search client, number, venue" className="input pl-9" />
        </form>
      </div>

      {rows.length === 0 ? (
        <Empty
          title={q || status ? "Nothing matches" : `No ${noun}s yet`}
          body={q || status ? "Try a different filter or search." : `Create your first ${noun} and it will show up here.`}
          action={
            !q && !status ? (
              <Link href={`${base}/new`} className="btn-primary">
                <Plus size={16} /> New {noun}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Client</th>
                    <th className="hidden md:table-cell">Event</th>
                    <th className="hidden sm:table-cell">{type === "quote" ? "Valid until" : "Due"}</th>
                    <th className="text-right">Total</th>
                    {type === "invoice" ? <th className="hidden text-right sm:table-cell">Balance</th> : null}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ doc, client, state }) => (
                    <tr key={doc.id} className="row-link relative">
                      <td className="whitespace-nowrap font-medium text-ink">
                        <Link href={`${base}/${doc.id}`} className="after:absolute after:inset-0">
                          {doc.number}
                        </Link>
                        <p className="text-xs font-normal text-mute">{formatDate(doc.issueDate)}</p>
                      </td>
                      <td className="max-w-[14rem]">
                        <p className="truncate text-ink">{client.company || client.name}</p>
                        {client.company ? <p className="truncate text-xs text-mute">{client.name}</p> : null}
                      </td>
                      <td className="hidden max-w-[14rem] md:table-cell">
                        <p className="truncate text-ink">{doc.eventType || "—"}</p>
                        <p className="truncate text-xs text-mute">
                          {[doc.eventDate ? formatDate(doc.eventDate) : "", doc.venue].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap text-mute sm:table-cell">{formatDate(doc.dueDate)}</td>
                      <td className="whitespace-nowrap text-right text-ink">{formatZAR(doc.total)}</td>
                      {type === "invoice" ? (
                        <td className="hidden whitespace-nowrap text-right sm:table-cell">
                          {doc.status === "void" ? "—" : formatZAR(doc.total - doc.amountPaid)}
                        </td>
                      ) : null}
                      <td>
                        <StatusBadge status={state} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-right text-xs text-mute">
            {rows.length} {noun}
            {rows.length === 1 ? "" : "s"} · {formatZAR(total)}
            {type === "invoice" ? ` · ${formatZAR(due)} unpaid` : ""}
          </p>
        </>
      )}
    </>
  );
}
