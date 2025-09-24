"use client";

import { ConvexProvider } from "convex/react";
import { getConvexReactClient } from "@/lib/convexClient";
import { ChatListProvider } from "@/context/ChatListContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    const client = getConvexReactClient();
    return (
        <ConvexProvider client={client}>
            <ChatListProvider>
                {children}
            </ChatListProvider>
        </ConvexProvider>
    );
}


