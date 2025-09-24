import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getConvexHttpClient } from "@/lib/convexServer";

export async function POST(req: Request) {
    const client = getConvexHttpClient();
    const { message, attachments } = await req.json().catch(() => ({ message: "", attachments: undefined }));
    const chatId = await client.mutation(api.chats.create, {
        title: "New Chat",
    });
    if (message && typeof message === "string") {
        await client.mutation(api.messages.add, {
            chatId,
            role: "user",
            content: message,
            attachments,
        });
    }
    return NextResponse.json({ chatId });
}


