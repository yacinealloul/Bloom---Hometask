import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { getConvexHttpClient } from "@/lib/convexServer";
import { api } from "@/convex/_generated/api";
import { E2B_API_KEY, E2B_TEMPLATE_ID } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
    const client = getConvexHttpClient();
    const { chatId, mode } = await req.json().catch(() => ({ chatId: undefined }));
    if (!chatId) {
        return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }
    if (!E2B_API_KEY) {
        return NextResponse.json({ error: "Missing E2B_API_KEY" }, { status: 500 });
    }

    let sandbox: Sandbox | null = null;
    let runId: any = null;
    let logBuffer = "";
    let flushTimeout: any = null;
    const flushLogs = async () => {
        if (!logBuffer || !runId) return;
        const toSend = logBuffer;
        logBuffer = "";
        await client.mutation(api.runs.appendLogs, { runId, chunk: toSend });
    };
    const enqueueLog = (data: string) => {
        logBuffer += data;
        if (flushTimeout) return;
        flushTimeout = setTimeout(async () => {
            try { await flushLogs(); } finally { flushTimeout = null; }
        }, 300);
    };

    try {
        sandbox = await Sandbox.create(E2B_TEMPLATE_ID as string, { apiKey: E2B_API_KEY });
        await sandbox.setTimeout(15 * 60 * 1000);
        runId = await client.mutation(api.runs.create, {
            chatId,
            sandboxId: sandbox.sandboxId,
        });

        await client.mutation(api.runs.setStatus, {
            runId,
            status: "running",
        });

        // Ensure app directory exists in the template before starting
        try {
            await sandbox.commands.run("bash -lc 'test -d app'", {});
        } catch {
            await client.mutation(api.runs.setStatus, { runId, status: "failed", error: "App directory missing in sandbox template" });
            return NextResponse.json({ runId, sandboxId: sandbox.sandboxId }, { status: 200 });
        }

        const startMode = mode === "expo" ? "expo" : "web";
        let previewUrl: string | undefined;
        if (startMode === "web") {
            const requestedPort = 8081;
            enqueueLog(`\n[run] ▶️ Starting Expo Web (requesting port ${requestedPort})\n`);
            let detectedPort: number | null = null;
            const detectPortFromLogs = async (data: string) => {
                if (detectedPort) return;
                const m = data.match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/i);
                if (m && m[1]) {
                    detectedPort = Number(m[1]);
                    enqueueLog(`\n[run] ℹ️ Detected web port from logs: ${detectedPort}\n`);
                }
            };
            const startCmd = `bash -lc 'cd app &&  npx expo start --web| tee -a /home/user/preview.log'`;
            await sandbox.commands.run(startCmd, {
                background: true,
                timeoutMs: 0,
                onStdout: async (data) => {
                    enqueueLog(data);
                    await detectPortFromLogs(data);
                },
                onStderr: async (data) => {
                    enqueueLog(data);
                    await detectPortFromLogs(data);
                },
            });
            await client.mutation(api.runs.setStatus, { runId, status: "running" });
            // Wait for a responding port and publish preview URL (try detected or common fallbacks)
            try {
                const deadline = Date.now() + 120_000;
                const candidates = Array.from(new Set([detectedPort ?? requestedPort, 19006, 5173, 3000, 3001, 3002, 19000, 19001, 19002, 19003])).filter(Boolean) as number[];
                let openPort: number | null = null;
                while (Date.now() < deadline && !openPort) {
                    for (const p of candidates) {
                        try {
                            await sandbox.commands.run("bash -lc 'timeout 1 bash -c \"</dev/tcp/127.0.0.1/" + p + "\"'", {
                                onStdout: async () => { },
                                onStderr: async () => { },
                            });
                            openPort = p;
                            break;
                        } catch { /* not open yet */ }
                    }
                    if (!openPort) await new Promise(r => setTimeout(r, 1500));
                }
                if (openPort) {
                    const host = sandbox.getHost(openPort);
                    previewUrl = `https://${host}`;
                    enqueueLog(`[run] 🔗 Preview available at ${previewUrl}\n`);
                    await client.mutation(api.runs.setStatus, { runId, status: "running", previewUrl });
                } else {
                    enqueueLog(`[run] ❌ No open web port detected after waiting. Keeping status as starting.\n`);
                }
                await flushLogs();
            } catch {
                // ignore
            }
        } else {
            // Expo Go/dev client via tunnel
            let previewUrlDetected: string | null = null;
            const detectUrl = async (data: string) => {
                // Try to extract exp:// or https:// Expo URL from logs (first occurrence wins)
                if (previewUrlDetected) return;
                const urlMatch = data.match(/(?:exp|https):\/\/[\S]+/);
                const found = urlMatch?.[0];
                if (found && !previewUrlDetected) {
                    previewUrlDetected = found;
                    await client.mutation(api.runs.setStatus, {
                        runId,
                        status: "running",
                        previewUrl: previewUrlDetected,
                    });
                    enqueueLog(`\n[run] 🔗 Preview available at ${previewUrlDetected}\n`);
                }
            };
            enqueueLog("\n[run] ▶️ Starting Expo (tunnel)\n");
            const startCmd = `bash -lc 'cd app && EXPO_ROUTER_APP_ROOT=./app CI=1 CHOKIDAR_USEPOLLING=1 EXPO_NO_INTERACTIVE=1 npx --yes expo@latest start --tunnel --clear 2>&1 | tee -a /home/user/preview.log'`;
            await sandbox.commands.run(startCmd, {
                background: true,
                timeoutMs: 0,
                onStdout: async (data) => {
                    enqueueLog(data);
                    await detectUrl(data);
                },
                onStderr: async (data) => {
                    enqueueLog(data);
                    await detectUrl(data);
                },
            });
            // Mark running even if URL not detected yet
            await client.mutation(api.runs.setStatus, { runId, status: "running" });
            // Fallback: if no tunnel URL detected quickly, expose Metro port (8081) over HTTP so iframe can load something
            try {
                const deadline = Date.now() + 60_000;
                while (!previewUrlDetected && Date.now() < deadline) {
                    try {
                        await sandbox.commands.run("bash -lc 'timeout 1 bash -c \"</dev/tcp/127.0.0.1/8081\"'", {
                            onStdout: async () => { },
                            onStderr: async () => { },
                        });
                        const host8081 = sandbox.getHost(8081);
                        await client.mutation(api.runs.setStatus, { runId, status: "running", previewUrl: `http://${host8081}` });
                        break;
                    } catch {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
            } catch { }
        }

        return NextResponse.json({ runId, sandboxId: sandbox.sandboxId, previewUrl });
    } catch (error: any) {
        const msg = typeof error?.message === "string" ? error.message : "Failed to start sandbox";
        try { await flushLogs(); } catch { }
        if (runId) {
            try { await client.mutation(api.runs.setStatus, { runId, status: "failed", error: msg }); } catch { }
        }
        return NextResponse.json({ runId, sandboxId: sandbox?.sandboxId, error: msg }, { status: 200 });
    }
}
