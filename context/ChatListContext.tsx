"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ChatListContextValue = {
    chatIds: string[];
    addChatId: (id: string) => void;
    removeChatId: (id: string) => void;
    clear: () => void;
};

const ChatListContext = createContext<ChatListContextValue | undefined>(undefined);

const STORAGE_KEY = "bloom.chatIds";

export function ChatListProvider({ children }: { children: React.ReactNode }) {
    const [chatIds, setChatIds] = useState<string[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setChatIds(parsed.filter(x => typeof x === "string"));
            }
        } catch { }
    }, []);

    useEffect(() => {
        try {
            console.log("Saving to localStorage:", chatIds);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chatIds));
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    }, [chatIds]);

    const addChatId = useCallback((id: string) => {
        console.log("Adding chat ID to localStorage:", id);
        setChatIds(prev => {
            if (prev.includes(id)) {
                console.log("Chat ID already exists, skipping");
                return prev;
            }
            const newIds = [id, ...prev].slice(0, 100);
            console.log("New chat IDs:", newIds);
            return newIds;
        });
    }, []);

    const removeChatId = useCallback((id: string) => {
        setChatIds(prev => prev.filter(x => x !== id));
    }, []);

    const clear = useCallback(() => setChatIds([]), []);

    const value = useMemo(() => ({ chatIds, addChatId, removeChatId, clear }), [chatIds, addChatId, removeChatId, clear]);

    return <ChatListContext.Provider value={value}>{children}</ChatListContext.Provider>;
}

export function useChatList() {
    const ctx = useContext(ChatListContext);
    if (!ctx) throw new Error("useChatList must be used within ChatListProvider");
    return ctx;
}


