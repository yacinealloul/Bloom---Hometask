import { NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convexServer";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");
    const runId = url.searchParams.get("runId");

    const client = getConvexHttpClient();
    try {
        if (runId) {
            const run = await client.query(api.runs.get, { runId: runId as any });
            if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
            return NextResponse.json({ run });
        }
        if (chatId) {
            const runs = await client.query(api.runs.listByChat, { chatId: chatId as any });
            const latest = runs?.[0];
            if (!latest) return NextResponse.json({ error: "No runs for chat" }, { status: 404 });
            return NextResponse.json({ run: latest });
        }
        return NextResponse.json({ error: "Provide chatId or runId" }, { status: 400 });
    } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : "Failed to fetch logs";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}


