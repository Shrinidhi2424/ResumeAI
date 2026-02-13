import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKeyRaw = process.env.GEMINI_API_KEY;

if (!apiKeyRaw) {
    console.error("Missing GEMINI_API_KEY in .env.local");
    process.exit(1);
}

const apiKey = apiKeyRaw.trim();
console.log(`API Key Length (Raw): ${apiKeyRaw.length}`);
console.log(`API Key Length (Trimmed): ${apiKey.length}`);

if (apiKeyRaw.length !== apiKey.length) {
    console.warn("WARNING: API Key in .env.local has trailing/leading whitespace!");
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    console.log("Testing Gemini API Authorization...");

    try {
        // Did not see a direct listModels in the high-level SDK helper in previous checking, 
        // but we can try the `gemini-1.5-flash` which is the standard "Flash" model user likely wants.
        // The user said "gemini 2.5 flash" which doesn't exist, likely meant 1.5-flash or 2.0-flash-exp.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash-latest",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        console.log("Attempting to generate content with candidate models...");

        for (const modelName of candidates) {
            console.log(`\n👉 Trying model: "${modelName}"`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test.");
                const response = result.response;
                console.log(`✅ SUCCESS! Model "${modelName}" is working.`);
                console.log(`Response: ${response.text()}`);
                return; // Stop at first success
            } catch (error: any) {
                console.log(`❌ Failed: ${error.message.split('[')[0]}`); // Log brief error
            }
        }

        console.error("\n❌ All attempted models failed.");

    } catch (error: any) {
        console.error("Fatal Error:", error);
    }
}


main();
