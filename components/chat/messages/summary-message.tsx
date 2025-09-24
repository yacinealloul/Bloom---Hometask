import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryMessageProps {
    content: string;
}

export default function SummaryMessage({ content }: SummaryMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full gap-3 justify-start"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-800/60 border border-green-600/40 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-300" />
            </div>

            <div className="max-w-[75%] rounded-2xl px-4 py-3 shadow-lg bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/30 text-green-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs uppercase font-semibold text-green-300 tracking-wide">Complete</span>
                </div>
                <div className="leading-relaxed text-[14px] prose prose-sm prose-invert max-w-none
                               prose-headings:text-green-200 prose-p:text-green-100
                               prose-strong:text-white prose-code:text-cyan-300
                               prose-code:bg-green-800/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                               prose-pre:bg-green-800/40 prose-pre:border prose-pre:border-green-600/40
                               prose-a:text-green-300 hover:prose-a:text-green-200
                               prose-blockquote:border-l-green-500 prose-blockquote:text-green-200
                               prose-ul:text-green-100 prose-ol:text-green-100
                               prose-li:marker:text-green-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </motion.div>
    );
}