import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listClients } from "@/lib/data";
import { formatZAR } from "@/lib/money";
import { Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Clients" };

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await listClients(q);
  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Clients"
        actions={
          <Link href="/clients/new" className="btn-primary">
            <Plus size={16} /> New client
          </Link>
        }
      />
      <form className="relative mb-4 md:w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand" />
        <input name="q" defaultValue={q} placeholder="Search name, company, email, phone" className="input pl-9" />
      </form>
      {rows.length === 0 ? (
        <Empty
          title={q ? "Nothing matches" : "No clients yet"}
          body={q ? undefined : "Clients are also added automatically when you create a quote."}
          action={
            !q ? (
              <Link href="/clients/new" className="btn-primary">
                <Plus size={16} /> New client
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th className="hidden sm:table-cell">Phone</th>
                  <th className="text-right">Documents</th>
                  <th className="text-right">Owing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client: c, docCount, outstanding }) => (
                  <tr key={c.id} className="row-link relative">
                    <td>
                      <Link href={`/clients/${c.id}`} className="font-medium text-ink after:absolute after:inset-0">
                        {c.company || c.name}
                      </Link>
                      {c.company ? <p className="text-xs text-mute">{c.name}</p> : null}
                    </td>
                    <td className="hidden text-mute md:table-cell">{c.email}</td>
                    <td className="hidden whitespace-nowrap text-mute sm:table-cell">{c.phone}</td>
                    <td className="text-right text-mute">{docCount}</td>
                    <td className={`whitespace-nowrap text-right ${outstanding > 0 ? "text-brand" : "text-mute"}`}>
                      {outstanding > 0 ? formatZAR(outstanding) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
