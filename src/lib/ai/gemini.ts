import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Thrown when an AI feature is used but Gemini is not configured.
 * Routes can check `instanceof AIUnavailableError` to fall back gracefully.
 */
export class AIUnavailableError extends Error {
    constructor(message = "GEMINI_API_KEY is not set, so AI features are unavailable.") {
        super(message);
        this.name = "AIUnavailableError";
    }
}

/**
 * Singleton Google Generative AI client, created on first use.
 *
 * We do NOT check the key at import time: any page that imports this
 * module would crash at build/render time if the key were missing.
 * Instead the check happens when an AI call is actually made.
 */
let client: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new AIUnavailableError();
    }
    if (!client) {
        client = new GoogleGenerativeAI(apiKey);
    }
    return client;
}

/** The model used everywhere. Override with the GEMINI_MODEL env var. */
export function getModelName(): string {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

/**
 * Get a Gemini model instance.
 *
 * @param modelName - Optional override; defaults to getModelName().
 */
export function getModel(modelName?: string) {
    return getGenAI().getGenerativeModel({ model: modelName || getModelName() });
}

/**
 * Send a prompt to Gemini and get the text response.
 *
 * @param prompt - The full prompt string
 * @param modelName - Optional model override
 * @returns The raw text response from the model
 * @throws AIUnavailableError if GEMINI_API_KEY is missing
 */
export async function generateContent(
    prompt: string,
    modelName?: string
): Promise<string> {
    const model = getModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
}
