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
    console.log("Checking Supabase Storage...");

    // List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error.message);
        return;
    }

    console.log("Existing buckets:", buckets.map(b => b.name));

    const bucketName = "resumes";
    const exists = buckets.find(b => b.name === bucketName);

    if (!exists) {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ["application/pdf"],
        });

        if (createError) {
            console.error("Failed to create bucket:", createError.message);
        } else {
            console.log(`Successfully created bucket '${bucketName}'.`);
        }
    } else {
        console.log(`Bucket '${bucketName}' already exists. OK.`);
    }
}

main();
