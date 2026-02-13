import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY is not set. Please add it to your .env.local file."
    );
}

/**
 * Singleton Google Generative AI client.
 * Used across the app for all AI-powered features:
 *   - Resume analysis
 *   - Cover letter generation
 *   - Interview question generation
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get a Gemini model instance.
 *
 * @param modelName - Defaults to "gemini-2.5-flash" as requested.
 *                    Can be overridden by GEMINI_MODEL env var.
 */
export function getModel(modelName?: string) {
    const model = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    return genAI.getGenerativeModel({ model });
}

/**
 * Send a prompt to Gemini and get the text response.
 * Handles the common pattern of sending a single prompt and extracting text.
 *
 * @param prompt - The full prompt string
 * @param modelName - Optional model override
 * @returns The raw text response from the model
 */
export async function generateContent(
    prompt: string,
    modelName?: string
): Promise<string> {
    const model = getModel(modelName);
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}

export { genAI };
