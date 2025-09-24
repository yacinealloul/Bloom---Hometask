import { getAzureClient, getAzureModel } from "@/lib/ai/client";
import type { AgentPayload } from "../types";
import { sanitizeActions } from "../utils";
import { z } from "zod";

const ActionSchema = z.object({
    type: z.enum(["write_file", "read_file", "list_dir", "run", "install_package", "remove_file"]),
    path: z.string().optional(),
    content: z.string().optional(),
    command: z.string().optional(),
    background: z.boolean().optional(),
    recursive: z.boolean().optional(),
    depth: z.number().optional(),
    status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
    pkg: z.string().optional(),
    packages: z.array(z.string()).optional(),
    dev: z.boolean().optional(),
});

const AgentPlanSchema = z.object({
    thoughts: z.string().optional().nullable(),
    actions: z.array(ActionSchema).min(0),
});

export function buildSystemPrompt(snapshot: string): string {
    const SANDBOX_ROOT = "/home/user/app";
    const MAX_ACTIONS = 12;

    return [
        "You are an expert mobile app development AI agent specialized in React Native and Expo.",
        `Project root: ${SANDBOX_ROOT}`,
        "",
        "## Context: Expo Router Project",
        "- This is an EXISTING create-expo-app project with Expo Router",
        "- The app/ directory contains the routing structure (file-based routing)",
        "- The project already has basic setup: package.json, app.json, tsconfig.json, etc.",
        "- You are EXTENDING an existing app, not creating from scratch",
        "",
        "## Your Role",
        "- Build features for the Expo Router application",
        "- Work with the established app/ directory structure",
        "- Create new screens, components, and features as needed",
        "- Update existing files when modifying functionality",
        "- Write clean, performant React Native code",
        "- Follow modern mobile UI/UX patterns",
        "- ALWAYS follow the Observer-Reflect-Act pattern",
        "",
        "## Workflow: Observer-Reflect-Act",
        "1. **OBSERVE** - Only when absolutely necessary:",
        "   - For completely unknown codebases: Read files to understand structure",
        "   - For simple modifications (like removing headers, updating styles): Skip observation",
        "",
        "2. **REFLECT** - Analyze and plan:",
        "   - What needs to be built?",
        "   - What files need creation/modification?",
        "",
        "3. **ACT** - Implement the solution:",
        "   - Install required packages if needed",
        "   - Update app/index.tsx for main screen changes",
        "   - Create new screen files (app/feature.tsx) for additional screens",
        "   - ALWAYS update app/_layout.tsx to register new screens in Stack",
        "   - Follow React Native best practices",
        "",
        "## Response Format",
        "Always respond with:",
        "1. Brief explanation following Observer-Reflect-Act workflow",
        "2. JSON code block with 'thoughts' and 'actions'",
        "",
        "## CRITICAL: JSON Format Rules",
        "- ALWAYS wrap your response in ```json and ``` tags",
        "- Include 'thoughts' string explaining your Observer-Reflect-Act approach",
        "- Include 'actions' array with proper action objects",
        "- Keep content strings short and escape quotes properly",
        "- Use simple ASCII characters only - NO unicode emojis in JSON strings",
        "- Use plain text like 'love' instead of ❤️ emoji in JSON content",
        "- Validate JSON syntax before responding",
        "",
        "## Actions Available",
        "- `list_dir`: Explore project structure",
        "- `read_file`: Read existing files",
        "- `write_file`: Create/update files (provide full content)",
        "- `run`: Execute commands (npm, expo, etc.)",
        "- `install_package`: Install npm packages (requires 'pkg' field with package name, optional 'dev' boolean)",
        "- `remove_file`: Delete files or directories",
        "",
        "## Implementation Strategy",
        "- For NEW features: Create new files for screens and components",
        "- For UPDATES: Read existing files first, then rewrite with modifications",
        "- When adding screens: ALWAYS update app/_layout.tsx to include new Stack.Screen",
        "- Remember: app/index.tsx is the main entry point users see first",
        "- When modifying existing functionality: Update the entire file with changes",
        "- Build complete, functional features with beautiful UI",
        "- Always apply modern design principles: clean typography, proper spacing, shadows, colors",
        "",
        "## Expo Router Structure Analysis",
        "- app/(tabs)/ = Tab navigation group",
        "- app/(tabs)/_layout.tsx = Tab layout configuration",
        "- app/(tabs)/index.tsx = Main tab screen",
        "- app/(tabs)/[dynamic].tsx = Dynamic route within tabs",
        "- app/(tabs)/(nested)/ = Nested route groups within tabs",
        "- app/_layout.tsx = Root app layout",
        "- app/[id].tsx = Dynamic route at root level",
        "- Always check for nested structures before making assumptions",
        "",
        "## Action Guidelines",
        "- Use write_file for creating new files or modifications",
        "- Use read_file to understand existing file contents first",
        "- When modifying existing files: read_file first, then write_file with full content",
        "- For install_package: use { \"type\": \"install_package\", \"pkg\": \"package-name\" } or { \"type\": \"install_package\", \"pkg\": \"package-name\", \"dev\": true }",
        "",
        `## Constraints`,
        `- Maximum ${MAX_ACTIONS} actions`,
        "- For simple tasks (update styles, remove headers, add buttons): Jump directly to implementation",
        "- Avoid unnecessary list_dir and read_file actions when the task is clear",
        "- Create new files for new features, update existing files for modifications",
        "- Always use write_file for file modifications (provide complete file content)",
        "- Never use scaffolding commands (create-expo-app, etc.)",
        "- NEVER run 'npx expo start' or similar dev server commands (already running)",
        "- You can always install packages with npm - no server management",
        "- Follow Observer-Reflect-Act: observe only when necessary, then implement",
        "- Build complete features with all necessary modifications",
        "- Project starts clean - build navigation and features as needed",
        "- Use Stack navigation only - add Stack.Screen in app/_layout.tsx for new routes",
        "- Main app logic starts in app/index.tsx - this is the first screen users see",
        "- NO tabs - always use Stack navigation pattern",
        "- When updating functionality, rewrite files completely with changes",
        "",
        "## Expo Router Conventions",
        "- app/index.tsx = MAIN entry point - this is where users land first",
        "- app/_layout.tsx = Navigation controller - ALL screens must be registered here",
        "- app/feature.tsx = Additional screens (registered in _layout.tsx)",
        "- app/[param].tsx = Dynamic routes",
        "- components/ = Reusable components (create as needed)",
        "- Navigation: All routes flow through _layout.tsx Stack configuration",
        "",
        "## IMPORTANT: User Experience Priority",
        "- REMINDER: The user sees app/index.tsx - BUILD FEATURES DIRECTLY IN THIS FILE FIRST",
        "- Add components, logic, and UI directly to index.tsx rather than creating separate pages",
        "- Only create separate pages/screens when the feature becomes too complex for a single file",
        "- Keep everything in index.tsx as long as it makes sense - users want to see immediate results",
        "- If you do create new pages, ensure navigation from index.tsx is obvious and working",
        "",
        "## What Usually Exists Already",
        "- package.json with expo, react-native, expo-router dependencies",
        "- app.json or app.config.js with Expo configuration",
        "- tsconfig.json for TypeScript support",
        "- Clean app/_layout.tsx with Stack navigation (add Stack.Screen for new routes)",
        "- Simple app/index.tsx with basic welcome message (UGLY - needs beautiful UI)",
        "- Metro bundler configuration",
        "- NO tabs structure - use Stack navigation only",
        "- NO default components - ready for beautiful custom implementation",
        "",
        "## Mobile Development Standards",
        "- Extend existing TypeScript setup (.tsx files)",
        "- Work with existing Expo Router navigation",
        "- Follow React Native best practices",
        "   - Use modern, clean UI design patterns",
        "   - Implement proper spacing, typography, and visual hierarchy",
        "   - Add shadows, rounded corners, and smooth interactions",
        "- Create beautiful, modern UI designs with proper styling:",
        "   - Use consistent color schemes (primary, secondary, neutral)",
        "   - Apply proper padding/margins (8, 16, 24, 32px increments)",
        "   - Add elevation/shadows for depth (shadowOffset, shadowOpacity)",
        "   - Use readable typography (fontSize: 14-18 for body, 20-24 for headers)",
        "   - Implement smooth borderRadius (8-12px for cards, 6-8px for buttons)",
        "   - Apply consistent button styles with proper press states",
        "- Use modern React patterns (hooks, functional components)",
        "",
        "## Example Response",
        "IMPORTANT: Do NOT include 'content' field in write_file actions - content will be generated intelligently during execution.",
        "",
        "For simple updates (like removing headers):",
        "```json",
        `{
  "thoughts": "Simple task to remove header from layout. No observation needed - just update the _layout.tsx file directly.",
  "actions": [
    { "type": "read_file", "path": "app/_layout.tsx" },
    { "type": "write_file", "path": "app/_layout.tsx" }
  ]
}`,
        "```",
        "",
        "For complex new features (content will be generated intelligently):",
        "```json",
        `{
  "thoughts": "Creating a todo app with modern UI and proper navigation. Each file will be generated with full context.",
  "actions": [
    { "type": "install_package", "pkg": "@expo/vector-icons" },
    { "type": "read_file", "path": "app/index.tsx" },
    { "type": "write_file", "path": "app/todo.tsx" },
    { "type": "write_file", "path": "components/TodoItem.tsx" },
    { "type": "write_file", "path": "app/_layout.tsx" }
  ]
}`,
        "```",
        "",
        "For creating a completely new app (CREATE approach):",
        "```json",
        `{
  "thoughts": "Observer: This is a request for a completely new app concept. I have a clean project with simple welcome screen and Stack navigation. Reflect: I'll create new screens and add them to the Stack in _layout.tsx. Act: Build new functionality using Stack navigation only.",
  "actions": [
    { "type": "list_dir", "path": "app" },
    { "type": "read_file", "path": "app/index.tsx" },
    { "type": "read_file", "path": "app/_layout.tsx" },
    { "type": "write_file", "path": "app/feature.tsx", "content": "..." },
    { "type": "write_file", "path": "app/details.tsx", "content": "..." },
    { "type": "write_file", "path": "app/_layout.tsx", "content": "import { Stack } from 'expo-router'; export default function RootLayout() { return (<Stack><Stack.Screen name='index' options={{ title: 'Home' }} /><Stack.Screen name='feature' options={{ title: 'Feature' }} /><Stack.Screen name='details' options={{ title: 'Details' }} /></Stack>); }" },
    { "type": "write_file", "path": "components/NewComponent.tsx", "content": "..." }
  ]
}`,
        "```",
        "",
        "## Current Project State",
        "```",
        snapshot.trim(),
        "```",
    ].join("\n");
}

export function extractAgentPayload(text: string): AgentPayload | null {
    console.log("=== EXTRACTING AGENT PAYLOAD ===");
    console.log("Full text length:", text.length);
    console.log("Text preview:", text.substring(0, 200));
    console.log("Text ending:", text.substring(Math.max(0, text.length - 200)));

    // Try multiple regex patterns to find JSON
    const patterns = [
        /```(?:json\s*)?\n?([\s\S]*?)\n?```/i,  // JSON in code blocks
        /```json\s*\n([\s\S]*?)\n```/i,         // Explicit json blocks
        /```\s*\n([\s\S]*?)\n```/i,             // Generic code blocks
        /(\{[\s\S]*\})/                          // Direct JSON (capture group for match[1])
    ];

    let match = null;
    for (const pattern of patterns) {
        match = text.match(pattern);
        if (match) {
            console.log("Found JSON with pattern:", pattern);
            break;
        }
    }

    if (!match) {
        console.error("No JSON code block found in text with any pattern");
        console.error("Available patterns tried:", patterns.length);
        return null;
    }

    try {
        // Handle different match groups
        let jsonContent = match[1] ? match[1].trim() : match[0].trim();
        console.log("Raw JSON content:", jsonContent);

        // Try to fix incomplete JSON by checking if it ends properly
        if (!jsonContent.endsWith('}')) {
            console.log("JSON appears incomplete, attempting to complete it...");

            // Count open/close braces to try to balance
            const openBraces = (jsonContent.match(/\{/g) || []).length;
            const closeBraces = (jsonContent.match(/\}/g) || []).length;

            if (openBraces > closeBraces) {
                // Add missing closing braces
                const missingBraces = openBraces - closeBraces;
                jsonContent += '\n' + '}'.repeat(missingBraces);
                console.log("Added", missingBraces, "missing closing braces");
            }

            // If content string is incomplete, try to close it
            const lastQuoteIndex = jsonContent.lastIndexOf('"');
            const lastColonIndex = jsonContent.lastIndexOf(':');

            if (lastColonIndex > lastQuoteIndex && !jsonContent.trim().endsWith('"')) {
                // Looks like an incomplete string value
                jsonContent += '"';
                console.log("Added missing closing quote");
            }
        }

        console.log("Attempting to parse JSON:", jsonContent.substring(0, 500) + "...");

        // Try to fix common JSON issues with React code content
        jsonContent = jsonContent.replace(/\\'/g, "'"); // Fix escaped single quotes
        jsonContent = jsonContent.replace(/([^\\])'/g, '$1\\"'); // Replace unescaped single quotes with escaped double quotes

        const parsed = JSON.parse(jsonContent);
        console.log("JSON parsed successfully, validating schema...");

        const validated = AgentPlanSchema.parse(parsed);
        const actions = sanitizeActions(validated.actions);
        const thoughts = typeof validated.thoughts === "string" ? validated.thoughts : null;

        console.log(`Extracted ${actions.length} actions successfully`);
        return { thoughts, actions };
    } catch (error) {
        console.error("Failed to extract agent payload:", error);
        console.error("Full JSON content length:", match[1].length);
        console.error("JSON preview:", match[1].substring(0, 1000));
        console.error("JSON ending:", match[1].substring(Math.max(0, match[1].length - 200)));

        // Try alternative parsing - maybe it's just a quote issue
        try {
            console.log("Attempting alternative JSON parsing...");
            const escapedContent = match[1].trim()
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
            const parsed2 = JSON.parse(escapedContent);
            const validated2 = AgentPlanSchema.parse(parsed2);
            const actions2 = sanitizeActions(validated2.actions);
            const thoughts2 = typeof validated2.thoughts === "string" ? validated2.thoughts : null;
            console.log("Alternative parsing successful!");
            return { thoughts: thoughts2, actions: actions2 };
        } catch (error2) {
            console.error("Alternative parsing also failed:", error2);
            return null;
        }
    }
}

export async function evaluateProgress(
    originalGoal: string,
    currentSnapshot: string,
    executedActions: string[]
): Promise<{ success: boolean; isComplete: boolean; nextSteps?: string; error?: string }> {
    try {
        const hasAzure = !!process.env.AZURE_OPENAI_API_KEY;
        if (!hasAzure) {
            return { success: false, isComplete: false, error: "Missing AZURE_OPENAI_API_KEY" };
        }

        const evaluationPrompt = [
            "You are an expert evaluator for mobile app development tasks.",
            "",
            "## Your Task",
            `Original Goal: ${originalGoal}`,
            "",
            "## Actions Executed",
            executedActions.length > 0 ? executedActions.join("\n") : "No actions executed yet",
            "",
            "## Current Project State",
            "```",
            currentSnapshot.trim(),
            "```",
            "",
            "## Instructions",
            "Evaluate if the original goal has been achieved. Respond with JSON only:",
            "- isComplete: true if goal is fully achieved, false otherwise",
            "- nextSteps: if not complete, describe what still needs to be done (be specific)",
            "",
            "## Response Format",
            "```json",
            '{ "isComplete": boolean, "nextSteps": "string or null" }',
            "```"
        ].join("\n");

        const response = await getAzureClient().chat.completions.create({
            model: getAzureModel(),
            messages: [{ role: "user", content: evaluationPrompt }],
            max_completion_tokens: 4096,
        });

        const content = response.choices?.[0]?.message?.content?.trim() ?? "";
        const match = content.match(/```(?:json\s*)?\n([\s\S]*?)\n```/i);

        if (match) {
            const parsed = JSON.parse(match[1]);
            return {
                success: true,
                isComplete: parsed.isComplete,
                nextSteps: parsed.nextSteps
            };
        }

        return { success: false, isComplete: false, error: "Failed to parse evaluation response" };
    } catch (error) {
        return { success: false, isComplete: false, error: String(error) };
    }
}

export async function generateAdaptivePlan(
    originalGoal: string,
    nextSteps: string,
    currentSnapshot: string,
    previousActions: string[],
    messageHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
        const hasAzure = !!process.env.AZURE_OPENAI_API_KEY;
        if (!hasAzure) {
            return { success: false, error: "Missing AZURE_OPENAI_API_KEY" };
        }

        const adaptivePrompt = [
            "You are an expert mobile app development AI agent specialized in React Native and Expo.",
            "",
            "## Context",
            `Original Goal: ${originalGoal}`,
            "",
            "## Previous Actions Executed",
            previousActions.length > 0 ? previousActions.join("\n") : "No previous actions",
            "",
            "## What Still Needs To Be Done",
            nextSteps,
            "",
            "## Current Project State",
            "```",
            currentSnapshot.trim(),
            "```",
            "",
            "## Your Task",
            "Generate ONLY the remaining actions needed to complete the goal.",
            "Follow Observer-Reflect-Act pattern but focus on what's still missing.",
            "",
            "## Response Format",
            "Brief explanation + JSON with thoughts and actions:",
            "",
            "```json",
            '{ "thoughts": "...", "actions": [...] }',
            "```",
        ].join("\n");

        // Build messages array with history if available
        const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

        // Add message history if provided (last 8 messages to avoid token limit)
        if (messageHistory && messageHistory.length > 0) {
            const recentHistory = messageHistory.slice(-8);
            messages.push(...recentHistory);
        }

        // Add adaptive prompt
        messages.push({ role: "user", content: adaptivePrompt });

        const response = await getAzureClient().chat.completions.create({
            model: getAzureModel(),
            messages,
            max_completion_tokens: 1500,
        });

        const content = response.choices?.[0]?.message?.content?.trim() ?? "";
        return { success: true, content };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function generatePlan(
    message: string,
    snapshot: string,
    messageHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
        const hasAzure = !!process.env.AZURE_OPENAI_API_KEY;
        if (!hasAzure) {
            return {
                success: false,
                error: "Missing AZURE_OPENAI_API_KEY"
            };
        }

        // Try streaming first, fallback to non-streaming
        try {
            type CompletionStreamEvent = {
                choices?: Array<{ delta?: { content?: string | null } | null } | null>;
            };

            // Build messages array with history if available
            const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
                { role: "system", content: buildSystemPrompt(snapshot) }
            ];

            // Add message history if provided (last 10 messages to avoid token limit)
            if (messageHistory && messageHistory.length > 0) {
                const recentHistory = messageHistory.slice(-10);
                messages.push(...recentHistory);
            }

            // Add current message
            messages.push({ role: "user", content: message });

            const stream = (await getAzureClient().chat.completions.create({
                model: getAzureModel(),
                messages,
                max_completion_tokens: 4096,
                stream: true,
            })) as unknown as AsyncIterable<CompletionStreamEvent>;

            let fullContent = "";
            for await (const event of stream) {
                const delta = event?.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                    fullContent += delta;
                }
            }

            return { success: true, content: fullContent };
        } catch {
            // Fallback to non-streaming
            // Build messages array with history if available
            const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
                { role: "system", content: buildSystemPrompt(snapshot) }
            ];

            // Add message history if provided (last 10 messages to avoid token limit)
            if (messageHistory && messageHistory.length > 0) {
                const recentHistory = messageHistory.slice(-10);
                messages.push(...recentHistory);
            }

            // Add current message
            messages.push({ role: "user", content: message });

            const planningResponse = await getAzureClient().chat.completions.create({
                model: getAzureModel(),
                messages,
                max_completion_tokens: 4096,
            });

            const content = planningResponse.choices?.[0]?.message?.content?.trim() ?? "";
            return { success: true, content };
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        };
    }
}
