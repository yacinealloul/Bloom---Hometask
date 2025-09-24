import { posix as path } from "node:path";
import type { AgentAction, ExecuteContext, ToolResult } from "@/lib/ai/tools/types";
import { normalizePath, toRelative, escapeDoubleQuotes, runSandboxCommand, wrapProjectCommand } from "@/lib/ai/tools/utils";

export async function readFile(action: AgentAction, { sandbox, log, readFiles }: ExecuteContext): Promise<ToolResult> {
    try {
        if (!action.path) {
            throw new Error("read_file requires 'path'");
        }

        const target = normalizePath(action.path);

        try {
            const data = await sandbox.files.read(target);
            const text = typeof data === "string" ? data : Buffer.from(data).toString("utf-8");

            log.push(`[readFile] read ${target}\n`);

            // Store in context for future actions
            if (readFiles) {
                readFiles.set(target, text);
                log.push(`[readFile] stored ${target} in context (${text.length} chars)\n`);
            }

            return {
                success: true,
                message: `File content: ${toRelative(target)}\n\n\`\`\`\n${text}\n\`\`\``,
                data: { path: target, content: text, size: text.length }
            };
        } catch (err) {
            // Try to list parent directory for better error message
            let listing = "";
            const parent = path.dirname(target);

            try {
                await runSandboxCommand(
                    sandbox,
                    wrapProjectCommand(`ls -la "${escapeDoubleQuotes(parent)}"`),
                    log,
                    {
                        quiet: true,
                        collectStdout: (c) => {
                            listing += c;
                        },
                    }
                );
            } catch { /* ignore listing errors */ }

            const shown = listing.trim() || "(empty)";

            return {
                success: false,
                message: `File not found: ${toRelative(target)}`,
                error: `Contents of ${toRelative(parent)}:\n\n\`\`\`\n${shown}\n\`\`\``
            };
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to read file",
            error: String(error)
        };
    }
}
