"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useChatData } from "@/components/providers/chat-data-provider";
import ChatMessages from "./chat-messages";
import { Button } from "@/components/ui/button";

export default function ChatClient() {
    const { runs } = useChatData();
    const latestRun = runs && runs.length ? runs[0] : null;
    const [showLogs, setShowLogs] = useState(false);
    return (
        <div className="flex h-full w-full flex-col px-6">


            <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-12 min-h-0">
                <div className="md:col-span-8 min-h-0">
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900/80 h-full rounded-xl border border-white/10">
                        <ChatMessages />
                    </motion.div>
                </div>
                <div className="md:col-span-4 min-h-0">
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900/80 flex h-full flex-col rounded-xl border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/10 p-3 text-xs uppercase tracking-wide text-neutral-500">
                            <span>Preview</span>
                            <div className="flex items-center gap-2">
                                {latestRun?.status ? (
                                    <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white">{latestRun.status}</span>
                                ) : null}
                                <Button
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px] uppercase tracking-wide text-neutral-300"
                                    onClick={() => {
                                        setShowLogs((v) => {
                                            return !v;
                                        });
                                    }}
                                >
                                    {showLogs ? "Hide logs" : "Logs"}
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {latestRun?.error ? (
                                <div className="px-3 py-2 text-[11px] text-red-300 bg-red-900/20 border-b border-red-900/30">
                                    {latestRun.error}
                                </div>
                            ) : null}
                            {showLogs ? (
                                <div className="h-full w-full overflow-auto p-3">
                                    <pre className="font-mono text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap">
                                        {latestRun?.logs || "No logs yet."}
                                    </pre>
                                </div>
                            ) : (
                                <div className="h-full w-full overflow-hidden">
                                    {latestRun?.previewUrl ? (
                                        <iframe
                                            title="preview"
                                            src={latestRun.previewUrl}
                                            className="h-full w-full border-0 touch-auto"
                                            allow="clipboard-read; clipboard-write; accelerometer; camera; encrypted-media;
             geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking; cross-origin-isolated"
                                            sandbox="allow-forms allow-modals allow-popups allow-presentation 
          +  allow-same-origin allow-scripts allow-top-navigation allow-downloads"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                                            Preview not available yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="border-t border-white/10 p-3 text-xs text-neutral-400">
                            {latestRun?.previewUrl ? (
                                <a href={latestRun.previewUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                                    Open in new tab
                                </a>
                            ) : null}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
