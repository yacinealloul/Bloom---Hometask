import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { E2B_API_KEY } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
    const { sandboxId } = await req.json().catch(() => ({ sandboxId: undefined }));
    if (!sandboxId) return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });
    if (!E2B_API_KEY) return NextResponse.json({ error: "Missing E2B_API_KEY" }, { status: 500 });

    try {
        const sandbox = await Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY });
        await sandbox.kill();
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        const msg = typeof error?.message === "string" ? error.message : "Failed to stop sandbox";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}


