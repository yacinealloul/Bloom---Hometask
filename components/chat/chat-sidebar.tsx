"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Smartphone, Trash2, PanelLeft } from "lucide-react";
import { useChatList } from "@/context/ChatListContext";
import { usePathname } from "next/navigation";


export default function ChatSidebar() {
    const { chatIds, removeChatId, clear } = useChatList();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);

    return (
        <aside
            className={`glass relative border-r border-white/10 rounded-xl flex flex-col ${collapsed ? "w-20 cursor-pointer hover:bg-white/20 hover:border-white/40" : "w-80"} transition-all duration-300 ease-in-out overflow-hidden`}
            onClick={() => collapsed && setCollapsed(false)}
        >
            {collapsed ? (
                // Mode collapsed - UI simple et propre
                <div className="flex flex-col h-full">
                    {/* Header avec les mêmes hauteurs que le mode normal */}
                    <div className="p-4 pb-3 flex justify-center">
                        <button
                            onClick={() => setCollapsed(false)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-100 transition-transform duration-200 hover:bg-white/10 hover:scale-105 active:scale-95"
                            title="Expand sidebar"
                        >
                            <div className="flex h-5 w-5 items-center justify-center">
                                <PanelLeft className="h-4 w-4 rotate-180" />
                            </div>
                        </button>
                    </div>

                    {/* Button nouveau chat à la même position */}
                    <div className="px-2 pb-4 flex justify-center">
                        <Link
                            href="/chat/new"
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-100 transition-all duration-200 hover:bg-white/10"
                            title="New conversation"
                        >
                            <div className="flex h-5 w-5 items-center justify-center">
                                <Plus className="h-4 w-4" />
                            </div>
                        </Link>
                    </div>


                    {/* Apps list à la même position */}
                    <div className="flex-1 px-2">
                        <div className="flex flex-col gap-2">
                            {chatIds.map((id) => {
                                const href = `/chat/${id}`;
                                const active = pathname === href;
                                return (
                                    <Link
                                        key={id}
                                        href={href}
                                        className={`group relative rounded-lg border p-2 transition-all duration-200 ${active
                                            ? "border-white/20 bg-white/10 text-white"
                                            : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/8"
                                            }`}
                                        title={`Mobile app • ${id}`}
                                    >
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg mx-auto transition-all ${active ? "bg-white/15" : "bg-white/10"}`}>
                                            <Smartphone className="h-4 w-4 text-white" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                // Mode normal
                <div className="flex flex-col h-full">
                    <div className="p-4 pb-3 flex items-center justify-between gap-2">
                        <div
                            className={`transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                                }`}
                        >
                            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium whitespace-nowrap">Your workspace</div>
                            <div className="text-sm font-semibold text-neutral-100 whitespace-nowrap">Mobile builds</div>
                        </div>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-100 transition-transform duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                            title="Collapse sidebar"
                        >
                            <div className="flex h-5 w-5 items-center justify-center">
                                <PanelLeft className="h-4 w-4" />
                            </div>
                        </button>
                    </div>

                    {/* New conversation button */}
                    <div className="px-4 pb-4">
                        <Link
                            href="/chat/new"
                            className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-neutral-100 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                            title="New conversation"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 shrink-0">
                                <Plus className="h-4 w-4" />
                            </div>
                            <span
                                className={`text-sm truncate font-medium transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                                    }`}
                            >
                                New conversation
                            </span>
                        </Link>
                    </div>

                    {/* Separator */}
                    <div className="mb-4 border-t border-white/10"></div>

                    {/* Apps List */}
                    <div
                        className={`px-4 transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
                            }`}
                    >
                        <div className="custom-scrollbar max-h-[calc(100dvh-320px)] space-y-3 overflow-y-auto pr-1">
                            {chatIds.length === 0 ? (
                                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center">
                                    <div className="text-sm text-neutral-400 mb-1">No apps yet</div>
                                    <div className="text-xs text-neutral-500">Create your first mobile app</div>
                                </div>
                            ) : (
                                chatIds.map((id) => {
                                    const href = `/chat/${id}`;
                                    const active = pathname === href;
                                    return (
                                        <div key={id}>
                                            <Link
                                                href={href}
                                                className={`group relative flex items-center rounded-xl border px-3 transition-all duration-200 ${active
                                                    ? "border-white/20 bg-white/10 text-white shadow-lg"
                                                    : "border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:border-white/15"
                                                    } ${collapsed ? "py-2 justify-center" : "py-3 gap-3"}`}
                                            >
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all shrink-0 ${active ? "bg-white/15" : "bg-white/10"
                                                    }`}>
                                                    <Smartphone className="h-4 w-4 text-white" />
                                                </div>
                                                {!collapsed && (
                                                    <>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-medium text-neutral-100">Mobile app • {id}</div>
                                                            <div className="truncate text-xs text-neutral-500">Latest conversation</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeChatId(id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-white/10 shrink-0"
                                                            title="Remove from sidebar"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </Link>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="px-4 pt-3 pb-2">
                        <div className="border-t border-white/10" />
                    </div>

                    {/* Footer Actions */}
                    <div
                        className={`px-4 pb-5 transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
                            }`}
                    >
                        {chatIds.length > 0 && (
                            <button
                                onClick={clear}
                                className="mt-3 w-full truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-400 transition-all duration-200 hover:bg-white/10 hover:text-neutral-300 hover:border-white/15"
                            >
                                Clear all apps
                            </button>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
