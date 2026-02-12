import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is not set. Please add it to your .env.local file."
    );
}

/**
 * Connection pool for Supabase PostgreSQL.
 *
 * `prepare: false` is required when connecting through Supabase's
 * connection pooler (PgBouncer in transaction mode).
 */
const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, {
    prepare: false,
    max: 1, // Serverless: keep pool small
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
