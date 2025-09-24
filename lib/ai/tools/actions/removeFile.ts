import type { AgentAction, ExecuteContext, ToolResult } from "../types";
import { normalizePath, toRelative } from "../utils";

export async function removeFile(action: AgentAction, { sandbox, log }: ExecuteContext): Promise<ToolResult> {
    try {
        if (!action.path) {
            throw new Error("remove_file requires 'path'");
        }

        const target = normalizePath(action.path);
        await sandbox.files.remove(target);

        log.push(`[removeFile] removed ${target}\n`);

        return {
            success: true,
            message: `Deleted: ${toRelative(target)}`,
            data: {
                path: target,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to remove file",
            error: String(error),
        };
    }
}
