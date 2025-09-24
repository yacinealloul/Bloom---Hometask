import type { AgentAction, ExecuteContext, ToolResult } from "../types";
import { runSandboxCommand, wrapProjectCommand } from "../utils";

export async function runCommand(action: AgentAction, { sandbox, log }: ExecuteContext): Promise<ToolResult> {
    try {
        if (!action.command) {
            throw new Error("run requires 'command'");
        }

        const banned = isDisallowedCommand(action.command);
        if (banned) {
            return {
                success: false,
                message: "Command not allowed",
                error: "This command is not allowed. Please use in-place modifications instead of scaffolding or external downloads."
            };
        }

        let output = "";
        await runSandboxCommand(sandbox, wrapProjectCommand(action.command), log, {
            background: !!action.background,
            collectStdout: (chunk) => {
                output += chunk;
            },
        });

        const trimmed = output.trim();

        return {
            success: true,
            message: trimmed
                ? `Command executed: ${action.command}\n\n\`\`\`\n${trimmed}\n\`\`\``
                : `Command executed: ${action.command}`,
            data: { command: action.command, output: trimmed, background: !!action.background }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to execute command: ${action.command}`,
            error: String(error)
        };
    }
}

function isDisallowedCommand(command: string): boolean {
    const patterns = [
        /\bcreate-expo-app\b/i,
        /\bcreate-next-app\b/i,
        /\bnpm\s+(init|create)\b/i,
        /\byarn\s+create\b/i,
        /\bpnpm\s+create\b/i,
        /\bbun\s+create\b/i,
        /\bexpo\s+init\b/i,
        /\bgit\s+clone\b/i,
        /\bcurl\s+https?:\/\//i,
        /\bwget\s+https?:\/\//i,
    ];
    return patterns.some((re) => re.test(command));
}