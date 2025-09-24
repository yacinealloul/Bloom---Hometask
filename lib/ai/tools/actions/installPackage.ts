import type { AgentAction, ExecuteContext, ToolResult } from "@/lib/ai/tools/types";
import {
    runSandboxCommand,
    wrapProjectCommand,
    normalizePath,
    toRelative,
    escapeDoubleQuotes,
} from "@/lib/ai/tools/utils";

function sanitizePackageName(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const isValid = /^(@?[a-z0-9][\w\-./]*)(@[^\s]+)?$/i.test(trimmed);
    return isValid ? trimmed : null;
}

export async function installPackage(action: AgentAction, { sandbox, log }: ExecuteContext): Promise<ToolResult> {
    const names: string[] = [];

    if (typeof action.pkg === "string") {
        names.push(action.pkg);
    }
    if (Array.isArray(action.packages)) {
        for (const candidate of action.packages) {
            if (typeof candidate === "string") names.push(candidate);
        }
    }

    const sanitized = names
        .map(sanitizePackageName)
        .filter((value): value is string => Boolean(value));

    if (!sanitized.length) {
        const missingFields = [];
        if (!action.pkg && !action.packages?.length) {
            missingFields.push("'pkg' field with package name");
        }

        return {
            success: false,
            message: `No valid package name provided. Action received: ${JSON.stringify(action)}`,
            error: `install_package requires ${missingFields.join(" or ")}. Example: { "type": "install_package", "pkg": "react-native" }`,
        };
    }

    const flag = action.dev ? " --save-dev" : "";

    let installDirectory: string | null = null;
    if (typeof action.path === "string" && action.path.trim()) {
        try {
            const normalized = normalizePath(action.path);
            installDirectory = toRelative(normalized);
        } catch (error) {
            return {
                success: false,
                message: "Invalid install directory",
                error: String(error),
            };
        }
    }

    const packagesList = sanitized.join(" ");

    const installScript = installDirectory
        ? `cd "${escapeDoubleQuotes(installDirectory)}" && npm install${flag} ${packagesList}`
        : [
            "set -e",
            "if [ -f package.json ]; then",
            `  npm install${flag} ${packagesList}`,
            "elif [ -f app/package.json ]; then",
            `  cd app && npm install${flag} ${packagesList}`,
            "else",
            `  echo 'package.json not found in project root or app/' >&2`,
            "  exit 2",
            "fi",
        ].join("\n");

    try {
        let output = "";
        await runSandboxCommand(sandbox, wrapProjectCommand(installScript), log, {
            collectStdout: (chunk) => {
                output += chunk;
            },
        });

        const cleaned = output.trim();
        return {
            success: true,
            message: cleaned
                ? `Packages installed: ${sanitized.join(", ")}\n\n\`\`\`\n${cleaned}\n\`\`\``
                : `Packages installed: ${sanitized.join(", ")}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to install packages: ${sanitized.join(", ")}`,
            error: String(error),
        };
    }
}
