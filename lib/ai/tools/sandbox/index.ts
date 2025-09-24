import { Sandbox } from "@e2b/code-interpreter";
import type { LogWriter, SandboxConfig } from "../types";
import { getConvexHttpClient } from "@/lib/convexServer";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { E2B_TEMPLATE_ID } from "@/lib/env";
import { runSandboxCommand, wrapProjectCommand } from "../utils";

const DEFAULT_CONFIG: SandboxConfig = {
    apiKey: process.env.E2B_API_KEY || "",
    timeout: 15 * 60 * 1000, // 15 minutes
    rootPath: "/home/user/app",
    maxActions: 12,
};

export type SandboxRun = {
    sandbox: Sandbox;
    runId: Id<"runs">;
    reused: boolean;
};

export async function ensureSandboxRun(
    client: ReturnType<typeof getConvexHttpClient>,
    chatId: Id<"chats">,
    config: Partial<SandboxConfig> = {}
): Promise<SandboxRun> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    let runs: Doc<"runs">[] = [];
    try {
        runs = await client.query(api.runs.listByChat, { chatId });
    } catch {
        runs = [];
    }

    const candidate = runs.find((run) =>
        run.sandboxId &&
        (run.status === "ready" || run.status === "running")
    );

    if (candidate?.sandboxId) {
        try {
            const sandbox = await Sandbox.connect(candidate.sandboxId, { apiKey: fullConfig.apiKey });
            await sandbox.setTimeout(fullConfig.timeout);
            return { sandbox, runId: candidate._id, reused: true };
        } catch {
            await client.mutation(api.runs.setStatus, {
                runId: candidate._id,
                status: "off",
                error: "Sandbox unavailable. Creating a fresh instance.",
            });
        }
    }

    const created = await createSandboxRun(client, chatId, fullConfig);
    return { ...created, reused: false };
}

async function createSandboxRun(
    client: ReturnType<typeof getConvexHttpClient>,
    chatId: Id<"chats">,
    config: SandboxConfig
): Promise<Omit<SandboxRun, "reused">> {
    const sandbox = await Sandbox.create(E2B_TEMPLATE_ID as string, { apiKey: config.apiKey });
    await sandbox.setTimeout(config.timeout);

    const runId = await client.mutation(api.runs.create, {
        chatId,
        sandboxId: sandbox.sandboxId,
    });

    return { sandbox, runId };
}

export function createLogWriter(
    client: ReturnType<typeof getConvexHttpClient>,
    runId: Id<"runs">
): LogWriter {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const flush = async () => {
        if (!buffer) return;
        const chunk = buffer;
        buffer = "";
        await client.mutation(api.runs.appendLogs, { runId, chunk });
    };

    const push = (chunk: string) => {
        if (!chunk) return;
        buffer += chunk;
        if (timeout) return;

        timeout = setTimeout(async () => {
            timeout = null;
            try {
                await flush();
            } catch {
                // ignore log append errors
            }
        }, 250);
    };

    return {
        push,
        flush: async () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            await flush();
        },
    };
}

export async function getProjectSnapshot(sandbox: Sandbox, log: LogWriter): Promise<string> {
    const sections: string[] = [];

    await runSandboxCommand(sandbox, "bash -lc 'mkdir -p /home/user/app'", log);

    const capture = async (title: string, command: string) => {
        let buffer = "";
        const safeCommand = `(${command}) || true`;
        await runSandboxCommand(sandbox, wrapProjectCommand(safeCommand), log, {
            quiet: true,
            collectStdout: (chunk) => {
                buffer += chunk;
            },
        });
        const content = buffer.trim() || "(no output)";
        sections.push([`## ${title}`, content].join("\n"));
    };

    await capture("Root listing", "ls -la . | head -n 200");
    await capture("Directory tree (depth 3)", "find . -maxdepth 3 -type f -print | head -n 200");
    await capture("Key files", "ls app 2>/dev/null; echo ''; ls app/api 2>/dev/null");
    await capture("package.json", "if [ -f package.json ]; then sed -n '1,200p' package.json; else echo 'package.json missing'; fi");
    await capture(
        "Expo entry",
        "if [ -f app/_layout.tsx ]; then sed -n '1,160p' app/_layout.tsx; fi;" +
        "if [ -f app/index.tsx ]; then echo ''; sed -n '1,160p' app/index.tsx; fi;" +
        "if [ -f app/details.tsx ]; then echo ''; sed -n '1,160p' app/details.tsx; fi;"
    );

    return sections.join("\n\n");
}
