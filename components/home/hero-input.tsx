import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Command, ArrowUp, Sparkles } from "lucide-react";
import SuggestionsMarquee from "@/components/home/suggestion-marquee";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroWithPromptInputProps {
    onClick?: (e: React.MouseEvent) => void;
    onSubmit?: (message: string) => void;
}

export default function HeroWithPromptInput({ onClick, onSubmit }: HeroWithPromptInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMobile = useIsMobile();

    // Accept suggestions from marquee via window event
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<string>).detail
            if (typeof detail === "string" && detail.length > 0) {
                setInputValue(detail)
                // focus textarea after setting value
                requestAnimationFrame(() => textareaRef.current?.focus())
            }
        }
        window.addEventListener("prompt:suggestion", handler as EventListener)
        return () => window.removeEventListener("prompt:suggestion", handler as EventListener)
    }, [])

    const handleSendPrompt = useCallback(() => {
        const msg = inputValue.trim();
        if (!msg) return;
        if (onSubmit) {
            onSubmit(msg);
        } else {
            console.log("Submitted:", msg);
            // Add your submission logic here
        }
    }, [inputValue, onSubmit]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSendPrompt();
        }
    }, [handleSendPrompt]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick(e);
    };

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 80;
            const maxHeight = 200;
            const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            textarea.style.height = newHeight + "px";
        }
    }, [inputValue]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4" onClick={handleClick}>
            <div className="w-full max-w-2xl space-y-3 sm:space-y-4 md:space-y-4">

                {/* Hero Text */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center space-y-1 sm:space-y-1 md:space-y-2"
                >
                    {/* Main Hero Text */}
                    <motion.div className="space-y-2">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight font-sans"
                        >
                            What do you want to create?
                        </motion.h1>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-sm md:text-base text-white/60 max-w-md mx-auto leading-relaxed font-light font-sans"
                    >
                        Start building with a single prompt.
                        <span className="text-white/80 font-medium">{" "}No coding needed.</span>
                    </motion.p>
                </motion.div>

                {/* Liquid Glass Input */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                >
                    <div
                        className={`relative backdrop-blur-3xl bg-white/[0.10] border border-white/25 rounded-4xl
              shadow-[0_36px_72px_rgba(0,0,0,0.16)] transition-all duration-300 ease-out ${isFocused
                                ? "ring-2 ring-white/25 bg-white/[0.15]"
                                : "hover:bg-white/[0.12] hover:border-white/30"
                            }`}
                    >
                        {/* Inner gradient glow */}
                        <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/15 to-transparent" />

                        {/* Floating orbs background */}
                        <div className="absolute inset-0 overflow-hidden rounded-4xl">
                            <motion.div
                                animate={{
                                    x: [0, 60, -30, 0],
                                    y: [0, -40, 20, 0],
                                    scale: [1, 1.2, 0.8, 1],
                                }}
                                transition={{
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute -top-6 -right-8 w-32 h-32 bg-gradient-to-br from-white/12 to-white/5 rounded-full blur-2xl"
                            />
                            <motion.div
                                animate={{
                                    x: [0, -50, 40, 0],
                                    y: [0, 30, -20, 0],
                                    scale: [1, 0.7, 1.3, 1],
                                }}
                                transition={{
                                    duration: 18,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute -bottom-6 -left-8 w-40 h-40 bg-gradient-to-br from-white/10 to-white/4 rounded-full blur-2xl"
                            />
                        </div>

                        <div className="relative p-4">
                            <Textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder=""
                                className={`${useMemo(() => {
                                    return [
                                        "w-full resize-none bg-transparent border-0 text-white/90 placeholder:text-white/40 rounded-4xl",
                                        "ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none focus-visible:outline-none shadow-none",
                                        "min-h-[80px] text-base sm:text-lg md:text-lg lg:text-xl leading-relaxed pr-16",
                                    ].join(" ");
                                }, [])} transition-all duration-200`}
                                style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: "0.015em",
                                    backgroundColor: "transparent !important",
                                }}
                            />

                            {/* Animated Placeholder */}
                            <AnimatePresence>
                                {!inputValue && !isFocused && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-4 left-4 pointer-events-none"
                                        transition={{ duration: 0.2 }}
                                    >
                                        <motion.span
                                            className="text-white/45 text-base sm:text-lg md:text-lg lg:text-xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            Tell me what you want to build
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Character Count */}
                            {inputValue.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-2 left-4 text-white/30 text-xs tabular-nums"
                                >
                                    {inputValue.length} characters
                                </motion.div>
                            )}

                            {/* Send Button */}
                            <div className="absolute bottom-4 right-4">
                                <AnimatePresence>
                                    {inputValue.trim() && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, rotate: -90 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 90 }}
                                            transition={{ type: "spring", stiffness: 600, damping: 25 }}
                                        >
                                            <Button
                                                onClick={handleSendPrompt}
                                                className="h-12 w-12 rounded-xl bg-white/95 hover:bg-white text-gray-900 border border-white/60 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
                                                style={{
                                                    boxShadow:
                                                        "0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.1)",
                                                }}
                                            >
                                                <ArrowUp className="h-5 w-5 transition-transform duration-200" />
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer Bar */}
                        <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-white/8">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-white/55 hover:text-white/80 hover:bg-white/8 transition-all duration-200 rounded-lg text-sm"
                                >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Attach</span>
                                </Button>

                                {inputValue.trim().length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-white/40 text-xs tabular-nums"
                                    >
                                        {inputValue
                                            .trim()
                                            .split(/\s+/)
                                            .filter((word) => word.length > 0).length} words
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-white/40 text-xs">
                                    <Command className="h-3 w-3 mr-1.5" />
                                    <span>⏎ Send</span>
                                </div>

                                {isFocused && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex items-center text-white/30 text-xs"
                                    >
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-2 h-2 bg-green-400 rounded-full mr-2"
                                        />
                                        <span>Ready</span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Background Glow Effect */}
                    <div
                        className="absolute inset-0 -z-10 rounded-4xl"
                        style={{
                            background:
                                "radial-gradient(800px circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 70%), radial-gradient(400px circle at 30% 80%, rgba(255, 255, 255, 0.05), transparent 50%), radial-gradient(400px circle at 70% 20%, rgba(255, 255, 255, 0.04), transparent 50%)",
                            filter: "blur(24px)",
                            transform: "scale(1.1)",
                        }}
                    />
                </motion.div>


                {/* Suggestions Marquee just below the prompt input */}
                <div className="mx-auto mt-4 w-full">
                    <SuggestionsMarquee
                        isLoading={false}
                        isMobile={isMobile}
                        onSuggestionClick={(suggestion) => {
                            window.dispatchEvent(
                                new CustomEvent("prompt:suggestion", { detail: suggestion }),
                            );
                        }}
                    />
                </div>

            </div>
        </div>
    );
}