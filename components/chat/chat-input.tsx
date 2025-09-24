"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, SlidersHorizontal, Loader2 } from "lucide-react";

type ChatInputProps = {
    onSend: (message: string) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
};

export default function ChatInput({ onSend, disabled, placeholder = "Write your message..." }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            const enter = e.key === "Enter";
            const modifierSend = enter && (e.metaKey || e.ctrlKey);
            const plainEnterSend = enter && !e.shiftKey && !e.metaKey && !e.ctrlKey;
            if (modifierSend || plainEnterSend) {
                e.preventDefault();
                if (!isSending && !disabled) void handleSend();
            }
        },
        [isSending, disabled]
    );

    // auto-resize
    useEffect(() => {
        const el = textAreaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const scrollHeight = el.scrollHeight;
        const min = 72; // comfortable starting height, reduced
        const max = 280; // hard cap for textarea height
        el.style.height = Math.max(min, Math.min(scrollHeight, max)) + "px";
    }, [input]);

    async function handleSend() {
        const msg = input.trim();
        if (!msg) return;
        setIsSending(true);
        setSendError(null);
        try {
            await onSend(msg);
            setInput("");
        } catch (e: any) {
            setSendError(typeof e?.message === "string" ? e.message : "Failed to send");
        } finally {
            setIsSending(false);
        }
    }

    const containerClasses = useMemo(() => [
        "relative w-full rounded-3xl border backdrop-blur-xl transition-all duration-300 ease-out",
        isFocused ? "border-white/30 bg-white/12 shadow-lg shadow-white/5" : "border-white/15 bg-white/6",
        "hover:border-white/25 hover:bg-white/8",
        isSending ? "border-cyan-400/30 bg-cyan-400/5" : "",
    ].join(" "), [isFocused, isSending]);

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
            }}
            className="border-t border-white/10 p-4"
        >
            <div className="mx-auto max-w-4xl min-w-0">
                <motion.div
                    className={containerClasses}
                    layout
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className="relative">
                        {/* Text area section */}
                        <div className="p-5 pb-3">
                            <Textarea
                                ref={textAreaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={isSending ? "Sending..." : "Ask a follow-up..."}
                                disabled={disabled || isSending}
                                className={useMemo(
                                    () => [
                                        "min-h-[72px] max-h-[240px]",
                                        "resize-none bg-transparent dark:bg-transparent border-0 text-white placeholder:text-white/60",
                                        "pr-3 pb-2",
                                        "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                                        "text-base leading-relaxed transition-all duration-200",
                                        "py-1.5",
                                        isSending ? "text-white/70" : "text-white",
                                    ].join(" "),
                                    [isSending]
                                )}
                                style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: "0.01em",
                                }}
                            />
                        </div>

                        {/* Footer controls section */}
                        <div className="flex items-center justify-between border-t border-white/12 px-4 pb-4 pt-2.5">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    whileHover={{ scale: 1 }}
                                    whileTap={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <Button
                                        type="button"
                                        disabled
                                        className="h-10 w-10 rounded-xl bg-white/8 p-0 text-white/35 cursor-not-allowed"
                                        aria-label="Attachments disabled"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1 }}
                                    whileTap={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <Button
                                        type="button"
                                        disabled
                                        className="h-10 w-10 rounded-xl bg-white/8 p-0 text-white/35 cursor-not-allowed"
                                        aria-label="Options"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                                <div className="ml-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-white/60">
                                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">⌘⏎</span>
                                    <span>to send</span>
                                    <span className="mx-1">•</span>
                                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">Shift+⏎</span>
                                    <span>newline</span>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                            >
                                <motion.div
                                    whileHover={{ scale: !input.trim() || disabled || isSending ? 1 : 1.05 }}
                                    whileTap={{ scale: !input.trim() || disabled || isSending ? 1 : 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <Button
                                        onClick={() => void handleSend()}
                                        disabled={!input.trim() || disabled || isSending}
                                        className={`h-12 w-12 rounded-2xl p-0 shadow-lg transition-all duration-200 ${!input.trim() || disabled || isSending
                                            ? "bg-white/15 text-white/40 cursor-not-allowed"
                                            : "bg-white text-black hover:bg-white ring-1 ring-white/70 hover:ring-2 hover:ring-cyan-300 hover:shadow-xl hover:shadow-cyan-300/30"
                                            }`}
                                        aria-label="Send message"
                                    >
                                        <AnimatePresence mode="wait">
                                            {isSending ? (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0, rotate: 0 }}
                                                    animate={{ opacity: 1, rotate: 360 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="arrow"
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ArrowUp className="h-5 w-5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {sendError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 text-right text-xs text-red-400"
                        >
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {sendError}
                            </motion.span>
                            <motion.button
                                onClick={() => void handleSend()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="ml-2 rounded bg-red-900/40 px-1.5 py-0.5 text-red-300 hover:bg-red-900/60 transition-colors duration-200"
                            >
                                Retry
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.form>
    );
}
