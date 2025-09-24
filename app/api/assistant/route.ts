import { NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convexServer";
import { AssistantService, formatError } from "@/lib/ai/assistant-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
    const client = getConvexHttpClient();
    const service = new AssistantService(client);
    let requestData: any = null;

    try {
        // Parse request body once
        requestData = await req.json().catch(() => ({}));

        // Validate request
        const { chatId, message, alreadyLogged } = await service.validateRequestData(requestData);

        // Log user message if needed
        if (!alreadyLogged) {
            await service.logUserMessage(chatId, message);
        }

        // Validate environment
        await service.validateEnvironment();

        // Setup sandbox environment
        const { sandbox, runId, log, snapshot } = await service.setupSandbox(chatId);

        // Generate execution plan
        const actions = await service.generateExecutionPlan(message, snapshot, chatId);

        // Execute actions
        await service.executeActions(actions, { sandbox, runId, log, chatId }, message);

        return NextResponse.json({ ok: true });

    } catch (error: unknown) {
        const msg = formatError(error) || "Assistant call failed";

        try {
            // Try to get chatId for error logging from already parsed data
            if (requestData?.chatId) {
                await service.logAssistantMessage(requestData.chatId, `System error: ${msg}`);
            } else {
                console.error("No chatId available for error logging:", msg);
            }
        } catch {
            // If we can't log error, just skip it
            console.error("Failed to log error message to chat:", msg);
        }

        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
