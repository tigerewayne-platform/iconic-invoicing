import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection is lazy: nothing connects until the first query, so builds work without a database.
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://not-configured@127.0.0.1:1/missing";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(url, { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
