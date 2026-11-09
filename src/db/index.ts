import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(url, { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
