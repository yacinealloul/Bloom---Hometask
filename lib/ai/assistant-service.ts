import { getConvexHttpClient } from "@/lib/convexServer";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { E2B_API_KEY } from "@/lib/env";
import {
    ensureSandboxRun,
    createLogWriter,
    getProjectSnapshot,
    generatePlan,
    extractAgentPayload,
    executeAction,
    describeAction,
    formatError,
    type AgentAction
} from "@/lib/ai/tools";
import { generateCodeForFile, type CodeGenerationContext, type ActionExecutionContext } from "@/lib/ai/tools/code-generation";

// Re-export formatError for the API route
export { formatError } from "@/lib/ai/tools";

export interface AssistantRequest {
    chatId: string;
    message: string;
    alreadyLogged?: boolean;
}

export interface AssistantResponse {
    ok: boolean;
    error?: string;
}

export class AssistantService {
    constructor(
        private client: ReturnType<typeof getConvexHttpClient>
    ) { }

    async validateRequest(req: Request): Promise<AssistantRequest> {
        const data = await req.json().catch(() => ({
            chatId: undefined,
            message: "",
            alreadyLogged: false,
        }));

        return this.validateRequestData(data);
    }

    async validateRequestData(data: any): Promise<AssistantRequest> {
        const { chatId, message, alreadyLogged } = data;

        if (!chatId || typeof message !== "string" || !message.trim()) {
            throw new Error("Missing chatId or message");
        }

        return { chatId, message, alreadyLogged: alreadyLogged || false };
    }

    async validateEnvironment(): Promise<void> {
        if (!E2B_API_KEY) {
            throw new Error("E2B_API_KEY not configured");
        }

        if (!process.env.AZURE_OPENAI_API_KEY) {
            throw new Error("AZURE_OPENAI_API_KEY not configured");
        }
    }

    async setupSandbox(chatId: string) {
        const { sandbox, runId } = await ensureSandboxRun(this.client, chatId as Id<"chats">);
        const log = createLogWriter(this.client, runId);

        try {
            await this.waitForSandboxReady(runId);
            const snapshot = await getProjectSnapshot(sandbox, log);
            return { sandbox, runId, log, snapshot };
        } catch (err) {
            const reason = formatError(err);
            await this.client.mutation(api.runs.setStatus, { runId, status: "failed", error: reason });
            throw new Error(`Sandbox not ready: ${reason}`);
        }
    }

    private async waitForSandboxReady(runId: Id<"runs">): Promise<void> {
        const READY_WAIT_TIMEOUT_MS = 45_000;
        const READY_WAIT_POLL_MS = 1_000;
        const deadline = Date.now() + READY_WAIT_TIMEOUT_MS;

        while (Date.now() <= deadline) {
            try {
                const run = await this.client.query(api.runs.get, { runId });
                if (run && (run.status === "ready" || run.status === "running")) {
                    return;
                }
                if (run?.status === "failed" || run?.status === "off") {
                    throw new Error(run.error || "Sandbox failed to initialize.");
                }
            } catch (err) {
                if (Date.now() > deadline) throw err;
            }

            await new Promise((resolve) => setTimeout(resolve, READY_WAIT_POLL_MS));
        }

        throw new Error("Sandbox not ready in time. Please retry in a few seconds.");
    }

    async generateExecutionPlan(message: string, snapshot: string, chatId: string): Promise<AgentAction[]> {
        // Get message history for context
        const messageHistory = await this.client.query(api.messages.listByChat, { chatId: chatId as Id<"chats"> });
        const historyForAI = messageHistory
            .filter(msg => msg.role === "user" || msg.role === "assistant")
            .map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content }));

        // Generate implementation plan with complete code content
        const planResult = await generatePlan(message, snapshot, historyForAI);
        if (!planResult.success || !planResult.content) {
            throw new Error(`Planning failed: ${planResult.error || "Unknown error"}`);
        }

        // Extract actions from plan first
        const payload = extractAgentPayload(planResult.content);
        if (!payload || !payload.actions.length) {
            throw new Error("Planning produced no executable actions");
        }

        // Show user-friendly plan (thoughts + action summary)
        const planSummary = this.formatPlanForDisplay(payload as { thoughts?: string; actions: AgentAction[] }, message);
        await this.client.mutation(api.messages.add, {
            chatId: chatId as Id<"chats">,
            role: "assistant",
            type: "plan",
            content: planSummary,
            createdAt: Date.now(),
        });

        const MAX_ACTIONS = 20;
        return payload.actions.slice(0, MAX_ACTIONS);
    }

    private formatPlanForDisplay(payload: { thoughts?: string; actions: AgentAction[] }, userRequest: string): string {
        const thoughts = payload.thoughts || "Let me work on your request...";

        // Group actions by type for better display
        const actionGroups: Record<string, string[]> = {};
        payload.actions.forEach(action => {
            if (!actionGroups[action.type]) {
                actionGroups[action.type] = [];
            }

            let description = '';
            switch (action.type) {
                case 'read_file':
                    description = `Read ${action.path}`;
                    break;
                case 'write_file':
                    description = `Create/update ${action.path}`;
                    break;
                case 'run':
                    description = `Execute: ${action.command}`;
                    break;
                case 'list_dir':
                    description = `Explore ${action.path || 'directory'}`;
                    break;
                case 'install_package':
                    description = `Install ${action.pkg || action.packages?.join(', ')}`;
                    break;
                case 'remove_file':
                    description = `Remove ${action.path}`;
                    break;
                default:
                    description = action.type;
            }
            actionGroups[action.type].push(description);
        });

        // Format the plan nicely
        let planText = `${thoughts}\n\n`;
        planText += `**Implementation Steps:**\n`;

        let stepNumber = 1;
        Object.values(actionGroups).flat().forEach(description => {
            planText += `${stepNumber}. ${description}\n`;
            stepNumber++;
        });

        return planText.trim();
    }

    async logUserMessage(chatId: string, message: string): Promise<void> {
        await this.client.mutation(api.messages.add, {
            chatId: chatId as Id<"chats">,
            role: "user",
            type: "standard",
            content: message,
            createdAt: Date.now(),
        });
    }

    async logAssistantMessage(chatId: string, content: string): Promise<void> {
        await this.client.mutation(api.messages.add, {
            chatId: chatId as Id<"chats">,
            role: "assistant",
            type: "standard",
            content,
            createdAt: Date.now(),
        });
    }

    async executeActions(
        actions: AgentAction[],
        context: { sandbox: any; runId: any; log: any; chatId: string },
        userRequest?: string
    ): Promise<void> {
        type ActionStatus = "pending" | "in_progress" | "completed" | "failed";
        type TrackedAction = AgentAction & { status: ActionStatus };

        const trackedActions: TrackedAction[] = actions.map((action) => ({
            ...action,
            status: "pending",
        }));

        // Keep track of all executed actions with results
        const executionHistory: Array<{
            action: AgentAction;
            result: any;
            success: boolean;
            stepLabel: string;
        }> = [];

        // Track all context for intelligent code generation
        const readFiles = new Map<string, string>();
        const createdFiles = new Map<string, string>();
        const actionHistory: ActionExecutionContext[] = [];

        // Store the message ID for updates instead of creating new messages
        let statusMessageId: Id<"messages"> | null = null;

        const postStatusUpdate = async (thoughts: string) => {
            const visibleActions = trackedActions.map(({ type, path, command, background, recursive, depth, status, pkg, packages, dev }) => ({
                type, path, command, background, recursive, depth, status, pkg, packages, dev,
            }));

            const thoughtsText = thoughts.trim() || "Executing actions...";

            if (statusMessageId) {
                // Update existing message
                await this.client.mutation(api.messages.update, {
                    id: statusMessageId,
                    thoughts: thoughtsText,
                    actions: visibleActions,
                    content: "", // Empty content for action_status messages
                });
            } else {
                // Create initial message and store its ID
                const messageId = await this.client.mutation(api.messages.add, {
                    chatId: context.chatId as Id<"chats">,
                    role: "system",
                    type: "action_status",
                    content: "", // Empty content for action_status messages
                    thoughts: thoughtsText,
                    actions: visibleActions,
                    createdAt: Date.now(),
                });
                statusMessageId = messageId;
            }
        };

        // Start with initial thoughts
        const initialThoughts = `Analyzing your request: "${userRequest || "user request"}"\n\nI'll execute ${actions.length} action(s) to fulfill this request. Let me work through them step by step.`;
        await postStatusUpdate(initialThoughts);

        try {
            for (let i = 0; i < trackedActions.length; i++) {
                const action = trackedActions[i];
                const stepLabel = `Step ${i + 1}/${trackedActions.length} · ${describeAction(action)}`;

                context.log.push(`\n[assistant] ${stepLabel}\n`);
                await context.log.flush();

                action.status = "in_progress";
                const progressThoughts = `Currently working on: ${describeAction(action)}.`;
                await postStatusUpdate(progressThoughts);

                // For write_file actions without content, generate intelligent content
                if (action.type === 'write_file' && !action.content && action.path) {
                    context.log.push(`[assistant] 🤖 Generating intelligent code for ${action.path}...\n`);

                    const codeContext: CodeGenerationContext = {
                        filePath: action.path,
                        userRequest: userRequest || "Generate file content",
                        readFiles,
                        createdFiles,
                        executionHistory: actionHistory,
                        projectSnapshot: "" // Could be enhanced to pass actual snapshot
                    };

                    const codeResult = await generateCodeForFile(codeContext);
                    if (codeResult.success && codeResult.content) {
                        action.content = codeResult.content;
                        context.log.push(`[assistant] Generated ${codeResult.content.length} characters of intelligent code\n`);
                    } else {
                        context.log.push(`[assistant] Failed to generate code: ${codeResult.error}\n`);
                        // Let it fall through to writeFile which will use fallback templates
                    }
                }

                const result = await executeAction(action, { sandbox: context.sandbox, log: context.log, readFiles });
                await context.log.flush();

                // Store ALL actions in execution history for context
                actionHistory.push({
                    type: action.type,
                    path: action.path,
                    result,
                    success: result.success
                });

                // Store created files in context for future generations
                if (action.type === 'write_file' && result.success && action.path && action.content) {
                    createdFiles.set(action.path, action.content);
                    context.log.push(`[assistant] 📝 Stored ${action.path} in generation context\n`);
                }

                context.log.push(`[assistant] 📊 Action ${action.type} added to context (${actionHistory.length} total actions)\n`);

                // Store in history
                executionHistory.push({
                    action,
                    result,
                    success: result.success,
                    stepLabel
                });

                if (result.success) {
                    action.status = "completed";
                    const successThoughts = `Completed: ${describeAction(action)}\n\nProgress: ${executionHistory.filter(h => h.success).length + 1}/${trackedActions.length} actions successful.`;
                    await postStatusUpdate(successThoughts);
                } else {
                    action.status = "failed";
                    const failureMessage = result.error || "Action failed";
                    context.log.push(`\n[assistant] Failed: ${failureMessage}\n`);
                    await context.log.flush();

                    const failureThoughts = `Failed: ${describeAction(action)}\n\nError: ${failureMessage}\n\nContinuing with remaining actions...`;
                    await postStatusUpdate(failureThoughts);

                    // For read_file failures, continue execution
                    // For critical failures, stop execution
                    const isCriticalFailure = action.type !== "read_file" && action.type !== "list_dir";
                    if (isCriticalFailure) {
                        throw new Error(failureMessage);
                    }
                }
            }

            // Final thoughts - mark as completed
            const successful = executionHistory.filter(h => h.success).length;
            const total = executionHistory.length;
            const finalThoughts = `All actions completed.`;

            await postStatusUpdate(finalThoughts);

            // Add final summary message with AI-generated conclusion
            const summaryMessage = await this.generateAISummary(executionHistory, userRequest || "user request");
            await this.client.mutation(api.messages.add, {
                chatId: context.chatId as Id<"chats">,
                role: "assistant",
                type: "summary",
                content: summaryMessage,
                createdAt: Date.now(),
            });

        } catch (error: unknown) {
            const errorMessage = formatError(error);
            await this.client.mutation(api.runs.setStatus, {
                runId: context.runId,
                status: "failed",
                error: errorMessage,
            });
            throw error;
        } finally {
            try {
                await context.log.flush();
            } catch {
                // ignore flush errors at shutdown
            }
        }
    }

    private generateExecutionSummary(history: Array<{ action: AgentAction; result: any; success: boolean; stepLabel: string }>): string {
        const successful = history.filter(h => h.success);
        const failed = history.filter(h => !h.success);

        const filesRead = history.filter(h => h.action.type === "read_file" && h.success).map(h => h.action.path);
        const filesWritten = history.filter(h => h.action.type === "write_file" && h.success).map(h => h.action.path);
        const commandsRun = history.filter(h => h.action.type === "run" && h.success).map(h => h.action.command);
        const packagesInstalled = history.filter(h => h.action.type === "install_package" && h.success).map(h => h.action.pkg || h.action.packages?.join(", "));
        const dirsListed = history.filter(h => h.action.type === "list_dir" && h.success).map(h => h.action.path);
        const filesRemoved = history.filter(h => h.action.type === "remove_file" && h.success).map(h => h.action.path);

        const parts = [
            "## 📋 Session Summary",
            "",
            `**Actions completed:** ${successful.length}/${history.length}`,
        ];

        if (filesRead.length > 0) {
            parts.push(`**Files analyzed:** ${filesRead.join(", ")}`);
        }

        if (filesWritten.length > 0) {
            parts.push(`**Files created/modified:** ${filesWritten.join(", ")}`);
        }

        if (packagesInstalled.length > 0) {
            parts.push(`**Packages installed:** ${packagesInstalled.filter(Boolean).join(", ")}`);
        }

        if (commandsRun.length > 0) {
            parts.push(`**Commands executed:** ${commandsRun.join(", ")}`);
        }

        if (dirsListed.length > 0) {
            parts.push(`**Directories explored:** ${dirsListed.join(", ")}`);
        }

        if (filesRemoved.length > 0) {
            parts.push(`**Files removed:** ${filesRemoved.join(", ")}`);
        }

        if (failed.length > 0) {
            parts.push(`**Failed actions:** ${failed.map(f => f.stepLabel).join(", ")}`);
        }

        // Add context about what was accomplished
        if (filesWritten.length > 0 || packagesInstalled.length > 0) {
            parts.push("", "**What was accomplished:**");
            if (packagesInstalled.length > 0) {
                parts.push(`• Installed ${packagesInstalled.length} package(s) for enhanced functionality`);
            }
            if (filesWritten.length > 0) {
                parts.push(`• Created/updated ${filesWritten.length} file(s) with new features`);
            }
            if (commandsRun.length > 0) {
                parts.push(`• Executed ${commandsRun.length} command(s) to configure the project`);
            }
        }

        return parts.join("\n");
    }

    private async generateAISummary(
        history: Array<{ action: AgentAction; result: any; success: boolean; stepLabel: string }>,
        originalRequest: string
    ): Promise<string> {
        const successful = history.filter(h => h.success);
        const failed = history.filter(h => !h.success);

        const filesRead = history.filter(h => h.action.type === "read_file" && h.success).map(h => h.action.path);
        const filesWritten = history.filter(h => h.action.type === "write_file" && h.success).map(h => h.action.path);
        const commandsRun = history.filter(h => h.action.type === "run" && h.success).map(h => h.action.command);
        const packagesInstalled = history.filter(h => h.action.type === "install_package" && h.success).map(h => h.action.pkg || h.action.packages?.join(", "));

        // Generate contextual summary using AI
        const summaryPrompt = `You just completed a development task. Generate a brief, natural summary of what you accomplished.

Original request: "${originalRequest}"

Actions taken:
${successful.length > 0 ? `Successful (${successful.length}):` : ''}
${successful.map(h => `- ${h.stepLabel}: ${h.result.message || 'completed'}`).join('\n')}

${failed.length > 0 ? `Failed (${failed.length}):` : ''}
${failed.map(h => `- ${h.stepLabel}: ${h.result.error || 'failed'}`).join('\n')}

Files analyzed: ${filesRead.join(', ') || 'none'}
Files created/modified: ${filesWritten.join(', ') || 'none'}
Packages installed: ${packagesInstalled.filter(Boolean).join(', ') || 'none'}
Commands run: ${commandsRun.join(', ') || 'none'}

Write a natural, conversational summary of what you accomplished. Focus on the end result and key features created, not the technical steps. Be concise (2-3 sentences max) and enthusiastic about what was built.

Example: "I've successfully created a habit tracking app with beautiful UI! The app now includes a home screen showing all habits with streak counters, an add habit form with global state management, and individual habit detail screens. Users can track their daily progress and build streaks with a clean, modern interface."`;

        try {
            const planResult = await generatePlan(summaryPrompt, "", []);
            if (planResult.success && planResult.content) {
                // Extract just the text response, not JSON
                const summary = planResult.content.replace(/```json[\s\S]*?```/g, '').trim();
                const technicalSummary = this.generateExecutionSummary(history);

                return `${summary}\n\n${technicalSummary}`;
            }
        } catch (error) {
            console.error("Failed to generate AI summary:", error);
        }

        // Fallback to technical summary
        const technicalSummary = this.generateExecutionSummary(history);
        return `Implementation complete! Your app is ready. 🚀\n\n${technicalSummary}`;
    }
}