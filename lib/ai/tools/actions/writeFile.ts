import { posix as path } from "node:path";
import { promises as fs } from "node:fs";
import type { AgentAction, ExecuteContext, ToolResult } from "../types";
import { normalizePath, toRelative, escapeDoubleQuotes, runSandboxCommand, wrapProjectCommand } from "../utils";

const SANDBOX_ROOT = "/home/user/app";
const MIRROR_LOCAL_WRITES = process.env.SANDBOX_MIRROR_LOCAL === "1";

export async function writeFile(action: AgentAction, { sandbox, log }: ExecuteContext): Promise<ToolResult> {
    try {
        if (!action.path) {
            throw new Error("write_file requires 'path'");
        }

        const target = normalizePath(action.path);
        let content: string | undefined =
            typeof action.content === "string" ? action.content : getDefaultFileContentForPath(action.path) ?? undefined;

        if (typeof content !== "string") {
            throw new Error("write_file requires 'content'");
        }

        await ensureDirectoryExists(target, { sandbox, log });
        await sandbox.files.write(target, content);

        // Trigger HMR
        try {
            const safeAbs = escapeDoubleQuotes(target);
            await runSandboxCommand(sandbox, `bash -lc 'touch "${safeAbs}"'`, log);
            log.push(`[writeFile] touched ${target} to trigger HMR\n`);
        } catch { /* non-fatal */ }

        // Optional: mirror write into local repository
        if (MIRROR_LOCAL_WRITES) {
            try {
                const relative = toRelative(target);
                const localDir = path.join(process.cwd(), path.dirname(relative));
                await fs.mkdir(localDir, { recursive: true });
                const localPath = path.join(process.cwd(), relative);
                await fs.writeFile(localPath, content, "utf-8");
                log.push(`[writeFile] mirrored write to ${localPath}\n`);
            } catch (mirrorErr) {
                log.push(`[writeFile] warn: failed to mirror write locally: ${String(mirrorErr)}\n`);
            }
        }

        log.push(`[writeFile] wrote ${target}\n`);

        return {
            success: true,
            message: `File created: ${toRelative(target)}`,
            data: { path: target, size: content.length }
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to write file",
            error: String(error)
        };
    }
}

async function ensureDirectoryExists(target: string, { sandbox, log }: ExecuteContext) {
    const dir = path.dirname(target);
    const safeDir = escapeDoubleQuotes(dir);
    await runSandboxCommand(sandbox, wrapProjectCommand(`mkdir -p "${safeDir}"`), log);
}

function getDefaultFileContentForPath(requestedPath: string): string | null {
    const normalized = requestedPath.replace(/\\/g, "/").toLowerCase();

    if (normalized.endsWith("app/_layout.tsx")) {
        return [
            "import { Stack } from 'expo-router';",
            "",
            "export default function RootLayout() {",
            "    return (",
            "        <Stack screenOptions={{ headerShown: false }}>",
            "            <Stack.Screen name=\"index\" />",
            "        </Stack>",
            "    );",
            "}",
            "",
        ].join("\n");
    }

    if (normalized.endsWith("app/index.tsx")) {
        return [
            "import { View, Text, StyleSheet, Pressable } from 'react-native';",
            "import { useRouter } from 'expo-router';",
            "",
            "export default function HomeScreen() {",
            "    const router = useRouter();",
            "",
            "    return (",
            "        <View style={styles.container}>",
            "            <Text style={styles.title}>Bloom v0</Text>",
            "            <Text style={styles.subtitle}>Kickstart your mobile app here ✨</Text>",
            "            <Pressable style={styles.button} onPress={() => router.push('/details')}>",
            "                <Text style={styles.buttonText}>View example</Text>",
            "            </Pressable>",
            "        </View>",
            "    );",
            "}",
            "",
            "const styles = StyleSheet.create({",
            "    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },",
            "    title: { fontSize: 32, fontWeight: '700', marginBottom: 12 },",
            "    subtitle: { fontSize: 16, opacity: 0.6, marginBottom: 24, textAlign: 'center' },",
            "    button: { backgroundColor: '#0f62fe', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },",
            "    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },",
            "});",
            "",
        ].join("\n");
    }

    if (normalized.endsWith("app/details.tsx")) {
        return [
            "import { View, Text, StyleSheet, Pressable } from 'react-native';",
            "import { useRouter } from 'expo-router';",
            "",
            "export default function DetailsScreen() {",
            "    const router = useRouter();",
            "",
            "    return (",
            "        <View style={styles.container}>",
            "            <Text style={styles.title}>Details</Text>",
            "            <Text style={styles.subtitle}>Feel free to customize this screen.</Text>",
            "            <Pressable style={styles.button} onPress={() => router.back()}>",
            "                <Text style={styles.buttonText}>Go back</Text>",
            "            </Pressable>",
            "        </View>",
            "    );",
            "}",
            "",
            "const styles = StyleSheet.create({",
            "    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },",
            "    title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },",
            "    subtitle: { fontSize: 16, opacity: 0.6, marginBottom: 24, textAlign: 'center' },",
            "    button: { backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },",
            "    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },",
            "});",
            "",
        ].join("\n");
    }

    return null;
}
