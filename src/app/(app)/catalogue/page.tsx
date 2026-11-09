import { listCatalog } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { CatalogEditor, CatalogRow } from "@/components/CatalogRow";

export const metadata = { title: "Catalogue" };

export default async function Catalogue() {
  const items = await listCatalog();
  const cats = Array.from(new Set(items.map((i) => i.category)));
  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Packages & extras" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-mute">
        Your price list. Anything here can be dropped into a quote in one click, and you can still change the price or wording on each quote.
      </p>
      <div className="space-y-6">
        {cats.map((cat) => (
          <section key={cat} className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-brand">{cat}</h2>
            <ul className="divide-y divide-line/70">
              {items
                .filter((i) => i.category === cat)
                .map((i) => (
                  <CatalogRow key={i.id} item={i} />
                ))}
            </ul>
          </section>
        ))}
        <section className="card p-5">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Add an item</h2>
          <CatalogEditor />
        </section>
      </div>
    </>
  );
}
