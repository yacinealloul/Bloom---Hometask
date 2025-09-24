"use client";

import React, { useEffect, useRef } from "react";
import { useChatData } from "@/components/providers/chat-data-provider";
import ChatInput from "./chat-input";
import ChatMessage from "./chat-message";


export default function ChatMessages() {
    const { messages, runs, chatId } = useChatData();
    const [isLoading, setIsLoading] = React.useState(false);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages?.length]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div
                ref={scrollRef}
                className="flex-1 space-y-5 overflow-auto p-6 custom-scrollbar"
            >
                {messages?.length ? (
                    messages.map((m: any) => (
                        <ChatMessage
                            key={m._id}
                            message={m}
                        />
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className="text-sm text-neutral-500">No messages yet.</div>
                            <div className="mt-2 text-xs text-neutral-600">Start the conversation!</div>
                        </div>
                    </div>
                )}

            </div>

            <ChatInput
                disabled={isLoading}
                onSend={async (msg) => {
                    setIsLoading(true);
                    try {
                        const response = await fetch("/api/assistant", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ chatId, message: msg }),
                        });
                        if (!response.ok) {
                            throw new Error(`Failed: ${response.status}`);
                        }
                    } catch (error) {
                        console.error("Failed to send message:", error);
                    } finally {
                        setIsLoading(false);
                    }
                }}
            />
        </div>
    );
}
