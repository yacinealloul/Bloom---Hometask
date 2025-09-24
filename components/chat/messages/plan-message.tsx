import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PlanMessageProps {
    content: string;
}

export default function PlanMessage({ content }: PlanMessageProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract the first part (thoughts) and implementation steps
    const parts = content.split('**Implementation Steps:**');
    const thoughts = parts[0]?.trim() || '';
    const steps = parts[1]?.trim() || '';

    // Get a summary from the first sentence of thoughts
    const summary = thoughts.split('.')[0] + (thoughts.split('.').length > 1 ? '...' : '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full gap-3 justify-start"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-800/60 border border-blue-600/40 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-300" />
            </div>

            <div className="max-w-[75%] rounded-2xl px-4 py-3 shadow-lg bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/30 text-blue-100">
                {/* Header with toggle */}
                <motion.div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileHover={{ opacity: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-semibold text-blue-300 tracking-wide">Implementation Plan</span>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4 text-blue-300" />
                    </motion.div>
                </motion.div>

                {/* Summary (always visible) */}
                <div className="mt-2 text-sm text-blue-200 leading-relaxed">
                    {summary}
                </div>

                {/* Expandable full content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-blue-700/30">
                                <div className="leading-relaxed text-[14px] prose prose-sm prose-invert max-w-none
                                               prose-headings:text-blue-200 prose-p:text-blue-100
                                               prose-strong:text-white prose-code:text-cyan-300
                                               prose-code:bg-blue-800/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                               prose-pre:bg-blue-800/40 prose-pre:border prose-pre:border-blue-600/40
                                               prose-a:text-blue-300 hover:prose-a:text-blue-200
                                               prose-blockquote:border-l-blue-500 prose-blockquote:text-blue-200
                                               prose-ul:text-blue-100 prose-ol:text-blue-100
                                               prose-li:marker:text-blue-300">

                                    {/* Full thoughts */}
                                    {thoughts && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {thoughts}
                                        </ReactMarkdown>
                                    )}

                                    {/* Implementation steps */}
                                    {steps && (
                                        <>
                                            <div className="font-semibold text-blue-200 mt-4 mb-2">Implementation Steps:</div>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {steps}
                                            </ReactMarkdown>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hint text */}
                <div className="mt-2 text-xs text-blue-400/60 flex items-center gap-1">
                    <span>Click to {isExpanded ? 'collapse' : 'expand'} details</span>
                </div>
            </div>
        </motion.div>
    );
}