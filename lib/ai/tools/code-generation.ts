import { getAzureClient, getAzureModel } from "@/lib/ai/client";

export interface ActionExecutionContext {
    type: string;
    path?: string;
    result: any;
    success: boolean;
}

export interface CodeGenerationContext {
    filePath: string;
    userRequest: string;
    readFiles: Map<string, string>;
    createdFiles: Map<string, string>;
    executionHistory: ActionExecutionContext[];
    projectSnapshot: string;
    previousCodeFragment?: string; // Pour la continuation
}

export async function generateCodeForFile(context: CodeGenerationContext): Promise<{
    success: boolean;
    content?: string;
    error?: string
}> {
    try {
        const { filePath, userRequest, readFiles, createdFiles, executionHistory, projectSnapshot, previousCodeFragment } = context;

        let fullContent = previousCodeFragment || '';
        let attempts = 0;
        const maxAttempts = 5; // Limite de sécurité

        while (attempts < maxAttempts) {
            attempts++;

            // Build comprehensive context from all previous actions
            const contextContent = buildContextContent(readFiles, createdFiles, executionHistory, projectSnapshot);

            const client = getAzureClient();
            const model = getAzureModel();

            const prompt = buildCodeGenerationPrompt(
                filePath,
                userRequest,
                contextContent,
                fullContent ? fullContent : undefined,
                attempts > 1
            );

            const result = await client.chat.completions.create({
                model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 4096,
                temperature: 0.3,
            });

            const rawContent = result.choices[0]?.message?.content?.trim();
            if (!rawContent) {
                return { success: false, error: "No content generated" };
            }

            // Clean up markdown code blocks if present
            const newContent = cleanMarkdownCodeBlocks(rawContent);

            // Si c'est la première génération, on prend tout
            if (attempts === 1) {
                fullContent = newContent;
            } else {
                // Sinon on concatène (le prompt demande de continuer)
                fullContent += newContent;
            }

            // Vérifier si on a atteint la limite de tokens
            const hitTokenLimit = result.choices[0]?.finish_reason === 'length';

            if (!hitTokenLimit) {
                // Génération complète, on peut retourner
                break;
            }

            // Si on atteint la limite, on continue avec le code accumulé
            console.log(`Token limit reached, continuing... (attempt ${attempts}/${maxAttempts})`);
        }

        return { success: true, content: fullContent };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

function buildContextContent(
    readFiles: Map<string, string>,
    createdFiles: Map<string, string>,
    executionHistory: ActionExecutionContext[],
    projectSnapshot: string
): string {
    const sections = [];

    if (projectSnapshot) {
        sections.push("## Project Structure");
        sections.push(projectSnapshot);
        sections.push("");
    }

    if (readFiles.size > 0) {
        sections.push("## Files Read (Existing Code)");
        for (const [path, content] of readFiles.entries()) {
            sections.push(`### ${path}`);
            sections.push("```typescript");
            sections.push(content);
            sections.push("```");
            sections.push("");
        }
    }

    if (createdFiles.size > 0) {
        sections.push("## Files Created Previously (Generated Code)");
        for (const [path, content] of createdFiles.entries()) {
            sections.push(`### ${path}`);
            sections.push("```typescript");
            sections.push(content);
            sections.push("```");
            sections.push("");
        }
    }

    if (executionHistory.length > 0) {
        sections.push("## Execution History (All Actions Performed)");

        const installedPackages = executionHistory
            .filter(action => action.type === 'install_package' && action.success)
            .map(action => action.result?.data?.pkg || action.result?.message || 'unknown package');

        if (installedPackages.length > 0) {
            sections.push("### Packages Installed");
            installedPackages.forEach(pkg => sections.push(`- ${pkg}`));
            sections.push("");
        }

        const directoryListings = executionHistory
            .filter(action => action.type === 'list_dir' && action.success);

        if (directoryListings.length > 0) {
            sections.push("### Directory Structure");
            directoryListings.forEach(action => {
                sections.push(`**${action.path}:**`);
                sections.push(action.result?.message || action.result?.data || "Listed directory");
                sections.push("");
            });
        }

        const commandResults = executionHistory
            .filter(action => action.type === 'run' && action.success);

        if (commandResults.length > 0) {
            sections.push("### Commands Executed");
            commandResults.forEach(action => {
                sections.push(`**Command:** ${action.result?.data?.command || 'unknown'}`);
                sections.push(`**Result:** ${action.result?.message || 'completed'}`);
                sections.push("");
            });
        }

        const removedFiles = executionHistory
            .filter(action => action.type === 'remove_file' && action.success);

        if (removedFiles.length > 0) {
            sections.push("### Files Removed");
            removedFiles.forEach(action => {
                sections.push(`- ${action.path} (${action.result?.message || 'deleted'})`);
            });
            sections.push("");
        }
    }

    return sections.join('\n');
}

function buildCodeGenerationPrompt(
    filePath: string,
    userRequest: string,
    contextContent: string,
    previousCode?: string,
    isContinuation: boolean = false
): string {
    const basePrompt = [
        "You are an expert React Native/Expo developer generating intelligent code.",
        "",
    ];

    if (isContinuation && previousCode) {
        basePrompt.push(
            "## CONTINUATION MODE",
            "You are continuing to generate code that was cut off due to token limits.",
            "The previous code fragment is provided below. Continue EXACTLY where it left off.",
            "DO NOT repeat any of the previous code - only add what comes next.",
            "DO NOT add any markdown code blocks or explanations.",
            "",
            "## Previous Code Fragment",
            "```typescript",
            previousCode,
            "```",
            "",
            "## Task",
            "Continue generating the remaining code for the file. Pick up exactly where the previous fragment ended.",
            "Generate ONLY the continuation - no repetition of previous code.",
        );
    } else {
        basePrompt.push(
            "## Task",
            `Generate complete, working code for: ${filePath}`,
            "",
            "## User Request",
            userRequest,
            "",
            "## Available Context",
            contextContent || "No previous context available.",
        );
    }

    basePrompt.push(
        "",
        "## Instructions",
        "- Generate ONLY the file content, no explanations or markdown",
        "- Use React Native/Expo best practices and modern patterns",
        "- Include proper TypeScript types and imports",
        "- Create beautiful, modern UI with proper styling",
        "- Follow Expo Router conventions for navigation",
        "- Base your code on ALL available context (packages, files, commands, etc.)",
        "- Ensure consistency with previously created/read files",
        "- Use installed packages shown in execution history",
        "- Consider directory structure from list_dir results",
        "- Take into account any commands that were run",
        "",
        "## File Type Guidelines",
        "- .tsx screens: Export default function with proper navigation and styling",
        "- .ts utilities: Export functions with TypeScript types",
        "- Components: Reusable with proper props interface",
        "- Navigation: Use useRouter() from expo-router for navigation",
        "",
        "## Styling Guidelines",
        "- Use StyleSheet.create() for all styles",
        "- Apply modern design: shadows, rounded corners, proper spacing",
        "- Use consistent color schemes and typography",
        "- Add proper padding/margins (8, 16, 24, 32px increments)",
        "- Include press states and interactions",
        "",
        isContinuation
            ? "Return ONLY the continuation of the code, nothing else."
            : "Return ONLY the complete file content, nothing else."
    );

    return basePrompt.join('\n');
}

function cleanMarkdownCodeBlocks(content: string): string {
    // Remove markdown code blocks (```typescript, ```javascript, ```tsx, etc.)
    let cleaned = content;

    // Remove opening code blocks
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/gm, '');

    // Remove closing code blocks
    cleaned = cleaned.replace(/\n?```$/gm, '');

    // Remove standalone closing backticks
    cleaned = cleaned.replace(/^```$/gm, '');

    // Trim any extra whitespace
    cleaned = cleaned.trim();

    return cleaned;
}