const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function run() {
    console.log("Testing Gemini 2.5 Flash streaming (Standalone)...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env.local");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = "Write a short 2-sentence poem about coding.";

        console.log(`Sending prompt: "${prompt}"`);

        const streamingResult = await model.generateContentStream(prompt);

        console.log("Stream started, waiting for chunks...");

        let fullText = "";
        for await (const chunk of streamingResult.stream) {
            const text = chunk.text();
            process.stdout.write(text);
            fullText += text;
        }

        console.log("\n\n--- Stream Complete ---");
        console.log("Full text length:", fullText.length);

    } catch (error) {
        console.error("\nError testing model:", error);
    }
}

run();
