import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { DEFAULT_CATALOG, DEFAULT_QUOTE_TERMS, DEFAULT_INVOICE_TERMS } from "../src/lib/defaults";
import { catalogItems, settings } from "../src/db/schema";
import { sql as dsql } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    console.log("[migrate] No DATABASE_URL set, skipping migrations.");
    return;
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] Schema up to date.");

  await db
    .insert(settings)
    .values({ id: 1, quoteTerms: DEFAULT_QUOTE_TERMS, invoiceTerms: DEFAULT_INVOICE_TERMS })
    .onConflictDoNothing();

  const [{ count }] = await db.select({ count: dsql<number>`count(*)::int` }).from(catalogItems);
  if (count === 0) {
    await db.insert(catalogItems).values(DEFAULT_CATALOG.map((c, i) => ({ ...c, sortOrder: i })));
    console.log(`[migrate] Seeded ${DEFAULT_CATALOG.length} catalogue items.`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
