"use client";

import { motion } from "motion/react";
import HeroWithPromptInput from "@/components/home/hero-input";
import { useRouter } from "next/navigation";
import InteractiveBackground from "@/components/background/interactive-background";
import { useChatList } from "@/context/ChatListContext";

export default function Home() {
  const router = useRouter();
  const { addChatId } = useChatList();

  const handleClick = (e: React.MouseEvent) => {
    // Emit a ripple to the global interactive background
    window.dispatchEvent(
      new CustomEvent("bg:ripple", {
        detail: { x: e.clientX, y: e.clientY },
      }),
    );
  };

  return (
    <div className="relative h-screen w-full">
      <InteractiveBackground />
      {/* Hero Interface Overlay */}
      <motion.div
        className="relative z-10 h-screen"
        initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onClick={handleClick}
      >
        <HeroWithPromptInput
          onClick={handleClick}
          onSubmit={async (message) => {
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
              });
              const json = await res.json();
              if (json?.chatId) {
                addChatId(json.chatId);
                setTimeout(() => {
                  void (async () => {
                    const payload = JSON.stringify({ chatId: json.chatId });
                    router.push(`/chat/${json.chatId}`);

                    // First, start the sandbox and wait for it to complete
                    try {
                      const response = await fetch("/api/runs/start", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: payload,
                      });
                      if (!response.ok) {
                        console.error("Failed to start sandbox", await response.text());
                        return; // Don't proceed to assistant if sandbox failed
                      }
                    } catch (err) {
                      console.error("Run start request failed", err);
                      return; // Don't proceed to assistant if sandbox failed
                    }

                    // Once sandbox is started, call the assistant
                    try {
                      const assistantResponse = await fetch("/api/assistant", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chatId: json.chatId, message, alreadyLogged: true }),
                      });
                      if (!assistantResponse.ok) {
                        console.error("Assistant request failed", await assistantResponse.text());
                      }
                    } catch (err) {
                      console.error("Assistant request errored", err);
                    }
                  })();
                }, 100);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />

      </motion.div>
    </div>
  );
}
