import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    // The user ID from the error message
    const userId = "user_39cPZGtF02vyJJHpao01QmkI32H";
    console.log(`Checking if user '${userId}' exists in 'users' table...`);

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching user:", error.message);
        if (error.code === "PGRST116") {
            console.log("Result: User NOT found.");
        }
    } else {
        console.log("Result: User FOUND.", data);
    }
}

main();
