"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SUGGESTIONS = [
    "Create a personal budget tracker",
    "Build a habit tracker with streaks",
    "Plan weekly meals with a grocery list",
    "Make a simple to‑do app with reminders",
    "Create a workout planner with timers",
    "Start a recipe book with photos",
    "Build a travel itinerary & packing list",
    "Create a language flashcards app",
    "Plan an event with invites & RSVPs",
    "Make a mood & wellness journal",
    "Track medications with reminders",
    "Split expenses with friends",
    "Create a pet care tracker (walks, vet, food)",
    "Build a study planner with Pomodoro",
    "Make a baby growth & feeding log",
    "Create a home inventory for insurance",
    "Log car maintenance & fuel costs",
    "Plan a garden watering schedule",
] as const

interface SuggestionsMarqueeProps {
    isLoading: boolean
    isMobile?: boolean
    onSuggestionClick: (suggestion: string) => void
}

export default function SuggestionsMarquee({ isLoading, isMobile = false, onSuggestionClick }: SuggestionsMarqueeProps) {
    useEffect(() => {
        const id = "promptinput-marquee-keyframes"
        if (document.getElementById(id)) return
        const style = document.createElement("style")
        style.id = id
        style.textContent = `
      @keyframes promptMarqueeScroll {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(-50%, 0, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .prefers-reduced-motion { animation: none !important; }
      }
    `
        document.head.appendChild(style)
        return () => { document.getElementById(id)?.remove() }
    }, [])

    return (
        <AnimatePresence mode="wait">
            {!isLoading && (
                <motion.div
                    key="suggestions-marquee"
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 8, filter: "blur(6px)", transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } }}
                    transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                    className="mt-6 relative"
                    style={{ willChange: "opacity, transform, filter" }}
                >
                    <div
                        className="relative left-1/2 -translate-x-1/2 w-[88vw] sm:w-[72vw] lg:w-[60vw] overflow-hidden"
                        style={{
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
                            maskImage:
                                "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
                            backfaceVisibility: "hidden",
                            transformStyle: "preserve-3d",
                        }}
                    >
                        <div className="overflow-hidden py-1">
                            <div
                                className="will-change-transform flex whitespace-nowrap"
                                style={{ animation: `promptMarqueeScroll ${isMobile ? 38 : 44}s linear infinite` }}
                            >
                                <div className="flex-none flex gap-3">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={`r1-${s}`}
                                            onClick={() => onSuggestionClick(s)}
                                            className={`${isMobile ? "px-4 py-2.5 text-sm" : "px-6 py-3 text-base"} rounded-2xl backdrop-blur-2xl bg-white/[0.06] border border-white/20 text-white/75 hover:text-white/90 hover:bg-white/[0.12] hover:border-white/30 transition-all duration-300`}
                                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)" }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div aria-hidden className="flex-none flex gap-3">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={`r1dup-${i}-${s}`}
                                            onClick={() => onSuggestionClick(s)}
                                            className={`${isMobile ? "px-4 py-2.5 text-sm" : "px-6 py-3 text-base"} rounded-2xl backdrop-blur-2xl bg-white/[0.06] border border-white/20 text-white/75 hover:text-white/90 hover:bg-white/[0.12] hover:border-white/30 transition-all duration-300`}
                                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)" }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden py-1 mt-3">
                            <div
                                className="will-change-transform flex whitespace-nowrap"
                                style={{ animation: `promptMarqueeScroll ${isMobile ? 40 : 48}s linear infinite reverse` }}
                            >
                                <div className="flex-none flex gap-3">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={`r2-${s}`}
                                            onClick={() => onSuggestionClick(s)}
                                            className={`${isMobile ? "px-4 py-2.5 text-sm" : "px-6 py-3 text-base"} rounded-2xl backdrop-blur-2xl bg-white/[0.06] border border-white/20 text-white/75 hover:text-white/90 hover:bg-white/[0.12] hover:border-white/30 transition-all duration-300`}
                                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)" }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div aria-hidden className="flex-none flex gap-3">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={`r2dup-${i}-${s}`}
                                            onClick={() => onSuggestionClick(s)}
                                            className={`${isMobile ? "px-4 py-2.5 text-sm" : "px-6 py-3 text-base"} rounded-2xl backdrop-blur-2xl bg-white/[0.06] border border-white/20 text-white/75 hover:text-white/90 hover:bg-white/[0.12] hover:border-white/30 transition-all duration-300`}
                                            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)" }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}