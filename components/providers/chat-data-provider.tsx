"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type ChatData = {
    messages: any[] | undefined;
    runs: any[] | undefined;
    chatId: string | null;
    isLoading: boolean;
};

const ChatDataContext = createContext<ChatData>({
    messages: undefined,
    runs: undefined,
    chatId: null,
    isLoading: false,
});

export function ChatDataProvider({ children }: { children: React.ReactNode }) {
    const params = useParams<{ chatId: string }>();
    const chatId = params.chatId as unknown as any;

    // Une seule instance de chaque query, partagée par tous les composants enfants
    const messages = useQuery(api.messages.listByChat, chatId ? { chatId } : "skip");
    const runs = useQuery(api.runs.listByChat, chatId ? { chatId } : "skip");

    const value = useMemo(
        () => ({
            messages,
            runs,
            chatId: chatId || null,
            isLoading: messages === undefined || runs === undefined,
        }),
        [messages, runs, chatId]
    );

    return <ChatDataContext.Provider value={value}>{children}</ChatDataContext.Provider>;
}

export function useChatData() {
    const context = useContext(ChatDataContext);
    if (!context) {
        throw new Error("useChatData must be used within ChatDataProvider");
    }
    return context;
}