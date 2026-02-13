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
    const userId = "user_39cPZGtF02vyJJHpao01QmkI32H"; // The ID from the error log
    const email = "shrinidhishetty2424@gmail.com"; // Assuming user's email or a placeholder

    console.log(`Creating/Ensuring user '${userId}' exists...`);

    const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

    if (existingUser) {
        console.log("User already exists. No action needed.");
        return;
    }

    const { data, error } = await supabase.from("users").insert([
        {
            id: userId,
            email: email,
            name: "Test User",
            role: "student",
            credits: 10,
        },
    ]);

    if (error) {
        console.error("Failed to create user:", error.message);
    } else {
        console.log("Successfully created user:", userId);
    }
}

main();
