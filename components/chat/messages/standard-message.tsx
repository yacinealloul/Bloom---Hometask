import React from "react";
import { motion } from "framer-motion";
import { UserIcon, BotIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment {
    name: string;
    type?: string;
    size?: number;
    path?: string;
    url?: string;
}

interface StandardMessageProps {
    role: "user" | "assistant" | "system";
    content: string;
    attachments?: Attachment[];
}

export default function StandardMessage({ role, content, attachments }: StandardMessageProps) {
    const isUser = role === "user";

    const isImage = (attachment: Attachment) => {
        return attachment.type?.startsWith('image/') ||
            attachment.name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-800 border border-white/15 flex items-center justify-center">
                    <BotIcon className="w-4 h-4 text-neutral-300" />
                </div>
            )}

            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                isUser
                    ? "bg-blue-600 text-white"
                    : "glass text-neutral-200"
            }`}>
                {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-[14px]">{content}</div>
                ) : (
                    <div className="leading-relaxed text-[14px] prose prose-sm prose-invert max-w-none
                                   prose-headings:text-neutral-200 prose-p:text-neutral-200
                                   prose-strong:text-white prose-code:text-cyan-300
                                   prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                   prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700
                                   prose-a:text-blue-400 hover:prose-a:text-blue-300
                                   prose-blockquote:border-l-neutral-600 prose-blockquote:text-neutral-300
                                   prose-ul:text-neutral-200 prose-ol:text-neutral-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                )}

                {attachments && attachments.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {attachments.map((attachment, idx) => {
                            if (isImage(attachment)) {
                                return (
                                    <div key={idx} className="space-y-2">
                                        {attachment.url && (
                                            <div className="rounded-lg overflow-hidden border border-white/20">
                                                <img
                                                    src={attachment.url}
                                                    alt={attachment.name}
                                                    className="max-w-full h-auto max-h-48 object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-neutral-300">
                                            <span className="truncate font-medium">{attachment.name}</span>
                                            {attachment.url && (
                                                <a className="text-cyan-400 hover:text-cyan-300 transition-colors" href={attachment.url} target="_blank" rel="noreferrer">
                                                    Open
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-neutral-300">
                                    <span className="truncate font-medium">{attachment.name}</span>
                                    {attachment.url ? (
                                        <a className="text-cyan-400 hover:text-cyan-300 transition-colors" href={attachment.url} target="_blank" rel="noreferrer">
                                            Open
                                        </a>
                                    ) : attachment.path ? (
                                        <span className="text-neutral-500">{attachment.type || "file"}</span>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 border border-white/15 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-neutral-300" />
                </div>
            )}
        </motion.div>
    );
}