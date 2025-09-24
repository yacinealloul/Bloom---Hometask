import type { AgentAction, ExecuteContext, ToolResult } from "../types";
import { writeFile } from "./writeFile";
import { readFile } from "./readFile";
import { listDir } from "./listDir";
import { runCommand } from "./runCommand";
import { installPackage } from "./installPackage";
import { removeFile } from "./removeFile";

export const tools = {
    write_file: writeFile,
    read_file: readFile,
    list_dir: listDir,
    run: runCommand,
    install_package: installPackage,
    remove_file: removeFile,
} as const;

export async function executeAction(action: AgentAction, ctx: ExecuteContext): Promise<ToolResult> {
    const tool = tools[action.type as keyof typeof tools];

    if (!tool) {
        return {
            success: false,
            message: `Unknown action: ${action.type}`,
            error: `Unsupported action type: ${action.type}`
        };
    }

    try {
        return await tool(action, ctx);
    } catch (error) {
        return {
            success: false,
            message: `Error while executing ${action.type}`,
            error: String(error)
        };
    }
}

export function describeAction(action: AgentAction): string {
    switch (action.type) {
        case "write_file":
            return action.path ? `write ${action.path}` : "write a file";
        case "read_file":
            return action.path ? `read ${action.path}` : "read a file";
        case "list_dir":
            return action.path ? `list ${action.path}` : "list a directory";
        case "run":
            return action.command ? `run ${action.command}` : "run a command";
        case "install_package":
            if (action.pkg) return `install ${action.pkg}`;
            if (action.packages?.length) return `install ${action.packages.join(", ")}`;
            return "install a package";
        case "remove_file":
            return action.path ? `delete ${action.path}` : "delete a file";
        default:
            return "action";
    }
}

export * from "./writeFile";
export * from "./readFile";
export * from "./listDir";
export * from "./runCommand";
export * from "./installPackage";
export * from "./removeFile";
