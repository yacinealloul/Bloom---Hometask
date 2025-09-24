import { posix as path } from "node:path";
import type { Sandbox } from "@e2b/code-interpreter";
import type { LogWriter } from "../types";

const SANDBOX_ROOT = "/home/user/app";

export function normalizePath(rawPath: string): string {
    const trimmed = rawPath.trim();
    const base = trimmed.startsWith("/") ? trimmed : path.join(SANDBOX_ROOT, trimmed);
    const normalized = path.normalize(base);

    if (!normalized.startsWith(SANDBOX_ROOT)) {
        throw new Error(`Path outside of project root: ${rawPath}`);
    }

    return normalized;
}

export function toRelative(absolute: string): string {
    if (absolute === SANDBOX_ROOT) return ".";
    return absolute.startsWith(`${SANDBOX_ROOT}/`) ? absolute.slice(SANDBOX_ROOT.length + 1) : absolute;
}

export function escapeDoubleQuotes(value: string): string {
    return value.replace(/"/g, '\\"');
}

export function wrapProjectCommand(body: string): string {
    const sanitized = body.replace(/\r/g, "");
    const escaped = sanitized.replace(/'/g, "'\\''");
    return `bash -lc 'mkdir -p ${SANDBOX_ROOT} && cd ${SANDBOX_ROOT} && ${escaped}'`;
}

export async function runSandboxCommand(
    sandbox: Sandbox,
    command: string,
    log: LogWriter,
    options: { background?: boolean; collectStdout?: (chunk: string) => void; quiet?: boolean } = {}
) {
    await sandbox.commands.run(command, {
        background: options.background,
        onStdout: (chunk: string) => {
            if (options.collectStdout) options.collectStdout(chunk);
            if (!options.quiet) {
                log.push(chunk);
            }
        },
        onStderr: (chunk: string) => {
            log.push(chunk);
        },
    });
}

export function formatError(error: unknown): string {
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message: unknown }).message === "string") {
        return (error as { message: string }).message;
    }
    return "Unknown error";
}

export function sanitizeActions(rawActions: unknown[]): import("../types").AgentAction[] {
    const supported = new Set<import("../types").AgentAction["type"]>([
        "write_file",
        "read_file",
        "list_dir",
        "run",
        "install_package",
        "patch_file",
        "remove_file",
    ]);

    return rawActions.reduce<import("../types").AgentAction[]>((acc, entry) => {
        if (!entry || typeof entry !== "object") return acc;

        const obj = entry as Record<string, unknown>;
        const type = obj.type;

        if (typeof type !== "string" || !supported.has(type as import("../types").AgentAction["type"])) return acc;

        const action: import("../types").AgentAction = {
            type: type as import("../types").AgentAction["type"],
            path: typeof obj.path === "string" ? obj.path : undefined,
            content: typeof obj.content === "string" ? obj.content : undefined,
            patch: typeof obj.patch === "string" ? obj.patch : undefined,
            command: typeof obj.command === "string" ? obj.command : undefined,
            background: typeof obj.background === "boolean" ? obj.background : undefined,
            recursive: typeof obj.recursive === "boolean" ? obj.recursive : undefined,
            depth: typeof obj.depth === "number" ? obj.depth : undefined,
            pkg: typeof obj.pkg === "string" ? obj.pkg : undefined,
            packages: Array.isArray(obj.packages) ? obj.packages.filter((item) => typeof item === "string") : undefined,
            dev: typeof obj.dev === "boolean" ? obj.dev : undefined,
        };

        acc.push(action);
        return acc;
    }, []);
}
