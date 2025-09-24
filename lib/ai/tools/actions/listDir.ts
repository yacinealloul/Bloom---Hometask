import type { AgentAction, ExecuteContext, ToolResult } from "../types";
import { normalizePath, toRelative, escapeDoubleQuotes, runSandboxCommand, wrapProjectCommand } from "../utils";

export async function listDir(action: AgentAction, { sandbox, log }: ExecuteContext): Promise<ToolResult> {
    try {
        const target = normalizePath(action.path ?? ".");
        const depth = Number.isFinite(action.depth) ? Math.max(1, Math.floor(action.depth!)) : 2;
        const recursive = !!action.recursive;
        const safePath = escapeDoubleQuotes(target);

        const body = recursive
            ? `if [ -d "${safePath}" ] || [ -e "${safePath}" ]; then ls -la "${safePath}" || true; echo ''; find "${safePath}" -maxdepth ${depth} -print || true; else echo "__MISSING__"; fi`
            : `if [ -d "${safePath}" ] || [ -e "${safePath}" ]; then ls -la "${safePath}" || true; else echo "__MISSING__"; fi`;

        let output = "";
        await runSandboxCommand(sandbox, wrapProjectCommand(body), log, {
            quiet: true,
            collectStdout: (chunk) => {
                output += chunk;
            },
        });

        const trimmed = output.trim();

        if (trimmed === "__MISSING__") {
            return {
                success: false,
                message: `Directory listing: ${toRelative(target)}\n\n\`\`\`\n(directory not found)\n\`\`\``,
                error: "Directory not found"
            };
        }

        const shown = trimmed || "(empty)";

        return {
            success: true,
            message: `Directory listing: ${toRelative(target)}\n\n\`\`\`\n${shown}\n\`\`\``,
            data: { path: target, listing: shown, recursive, depth }
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to list directory",
            error: String(error)
        };
    }
}
