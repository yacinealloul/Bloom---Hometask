"use client";

import { ConvexReactClient } from "convex/react";

let reactClient: ConvexReactClient | null = null;

function getConvexUrl(): string {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL env var for Convex");
    return url;
}

export function getConvexReactClient(): ConvexReactClient {
    if (!reactClient) {
        reactClient = new ConvexReactClient(getConvexUrl());
    }
    return reactClient;
}


