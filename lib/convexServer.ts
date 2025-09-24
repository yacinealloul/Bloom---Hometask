import { ConvexHttpClient } from "convex/browser";

let httpClient: ConvexHttpClient | null = null;

function getConvexUrl(): string {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL env var for Convex");
    return url;
}

export function getConvexHttpClient(): ConvexHttpClient {
    if (!httpClient) {
        httpClient = new ConvexHttpClient(getConvexUrl());
    }
    return httpClient;
}


