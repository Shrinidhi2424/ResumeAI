import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL env var!");
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function main() {
    console.log("Checking Database Tables...");

    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        const tableNames = tables.map((t: { table_name: string }) => t.table_name);
        console.log("Existing tables:", tableNames);

        const requiredTables = ["resumes", "analyses", "job_descriptions"];
        const missing = requiredTables.filter(t => !tableNames.includes(t));

        if (missing.length > 0) {
            console.error(`CRITICAL: Missing tables: ${missing.join(", ")}`);
            process.exit(1);
        } else {
            console.log("All critical tables exist.");
        }
    } catch (err) {
        console.error("Database connection error:", err);
    } finally {
        await sql.end();
    }
}

main();
