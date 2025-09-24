"use client";

import React from "react";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { ChatDataProvider } from "@/components/providers/chat-data-provider";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <ChatDataProvider>
            <div className="chat-layout flex h-dvh p-4">
                <ChatSidebar />
                <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            </div>
        </ChatDataProvider>
    );
}


