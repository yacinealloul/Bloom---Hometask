import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://yacine-resource.openai.azure.com/";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

let cachedAzureClient: AzureOpenAI | null = null;

export function getAzureClient(): AzureOpenAI {
    if (cachedAzureClient) return cachedAzureClient;
    const apiKey = process.env.AZURE_OPENAI_API_KEY // ;
    if (!apiKey) {
        throw new Error("Missing required environment variable: AZURE_OPENAI_API_KEY");
    }
    cachedAzureClient = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
    });
    return cachedAzureClient;
}

export function getAzureModel(): string {
    return process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";
}
