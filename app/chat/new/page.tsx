"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useChatList } from "@/context/ChatListContext";

export default function NewChatPage() {
    const router = useRouter();
    const { addChatId } = useChatList();
    const hasCreated = useRef(false);

    useEffect(() => {
        // Éviter la double création en mode strict
        if (hasCreated.current) return;
        hasCreated.current = true;

        async function create() {
            try {
                const res = await fetch("/api/chat", { method: "POST" });
                const json = await res.json();
                if (json?.chatId) {
                    // Ajouter au localStorage d'abord
                    addChatId(json.chatId);

                    // Attendre un peu pour s'assurer que le localStorage est mis à jour
                    setTimeout(() => {
                        // Démarrer la sandbox E2B en arrière-plan (sans bloquer la navigation)
                        fetch("/api/runs/start", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ chatId: json.chatId }),
                        }).catch(() => { });
                        router.replace(`/chat/${json.chatId}`);
                    }, 100);
                }
            } catch (error) {
                console.error("Failed to create chat:", error);
                router.replace("/");
            }
        }
        create();
    }, [addChatId, router]);

    return (
        <div className="p-6 text-sm text-neutral-400">Creating a new chat…</div>
    );
}


