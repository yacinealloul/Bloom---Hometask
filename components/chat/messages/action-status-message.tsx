import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BotIcon, FileText, Edit3, Play, FolderOpen, Package, Trash2, Settings, ChevronDown } from "lucide-react";
import LoadingDots from "@/components/ui/loading-dots";

interface Action {
    type: string;
    path?: string;
    command?: string;
    background?: boolean;
    recursive?: boolean;
    depth?: number;
    status: string;
    pkg?: string;
    packages?: string[];
    dev?: boolean;
}

interface ActionStatusMessageProps {
    thoughts: string;
    actions: Action[];
}

const getActionIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };

    switch (type) {
        case 'read_file': return <FileText {...iconProps} />;
        case 'write_file': return <Edit3 {...iconProps} />;
        case 'run': return <Play {...iconProps} />;
        case 'list_dir': return <FolderOpen {...iconProps} />;
        case 'install_package': return <Package {...iconProps} />;
        case 'remove_file': return <Trash2 {...iconProps} />;
        default: return <Settings {...iconProps} />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'text-green-400 bg-green-900/30 border-green-700/40';
        case 'in_progress': return 'text-blue-400 bg-blue-900/30 border-blue-700/40';
        case 'failed': return 'text-red-400 bg-red-900/30 border-red-700/40';
        default: return 'text-neutral-400 bg-neutral-800/30 border-neutral-700/40';
    }
};

const describeAction = (action: Action): string => {
    switch (action.type) {
        case 'read_file':
            return `Read ${action.path}`;
        case 'write_file':
            return `Write ${action.path}`;
        case 'run':
            return `Execute: ${action.command}`;
        case 'list_dir':
            return `List ${action.path || 'directory'}`;
        case 'install_package':
            return `Install ${action.pkg || action.packages?.join(', ')}`;
        case 'remove_file':
            return `Remove ${action.path}`;
        default:
            return action.type;
    }
};

export default function ActionStatusMessage({ thoughts, actions }: ActionStatusMessageProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasActiveActions = actions.some(action => action.status === 'in_progress');

    // Get counts for summary
    const completedCount = actions.filter(action => action.status === 'completed').length;
    const inProgressCount = actions.filter(action => action.status === 'in_progress').length;
    const totalCount = actions.length;

    // Get status summary
    const getStatusSummary = () => {
        if (inProgressCount > 0) {
            return `${completedCount}/${totalCount} completed, ${inProgressCount} in progress`;
        }
        return `${completedCount}/${totalCount} completed`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full gap-3 justify-start"
        >
            <motion.div
                animate={hasActiveActions ? { scale: [1, 1.05, 1] } : {}}
                transition={hasActiveActions ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-800 border border-white/15 flex items-center justify-center"
            >
                <BotIcon className={`w-4 h-4 ${hasActiveActions ? 'text-blue-400' : 'text-neutral-300'}`} />
            </motion.div>

            <div className="max-w-[75%] rounded-lg bg-neutral-800/60 border border-neutral-700/40 overflow-hidden">
                {/* Thoughts (always visible) */}
                {thoughts && (
                    <div className="px-3 py-2 border-b border-neutral-700/40">
                        <div className="text-sm font-medium leading-relaxed flex items-center gap-2 text-neutral-300">
                            {thoughts}
                        </div>
                    </div>
                )}

                {/* Actions summary header (clickable) */}
                <motion.div
                    className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-neutral-700/30 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-semibold text-neutral-400 tracking-wide">
                            Actions
                        </span>
                        <span className="text-xs text-neutral-500">
                            {getStatusSummary()}
                        </span>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                    </motion.div>
                </motion.div>

                {/* Expandable actions list */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 space-y-2 border-t border-neutral-700/40 pt-3">
                                {actions.map((action, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.2 }}
                                        className={`
                                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm border
                                            ${getStatusColor(action.status)}
                                        `}
                                    >
                                        <div className="text-neutral-400">{getActionIcon(action.type)}</div>
                                        <div className="flex-1">
                                            <div className="font-medium">{describeAction(action)}</div>
                                            {action.path && action.type !== 'read_file' && action.type !== 'write_file' && (
                                                <div className="text-xs opacity-70 mt-1">{action.path}</div>
                                            )}
                                        </div>
                                        <div className={`
                                            px-2 py-1 rounded text-xs font-medium capitalize flex items-center gap-1
                                            ${action.status === 'completed' ? 'bg-green-700/30 text-green-300' :
                                              action.status === 'in_progress' ? 'bg-blue-700/30 text-blue-300' :
                                              action.status === 'failed' ? 'bg-red-700/30 text-red-300' :
                                              'bg-neutral-700/30 text-neutral-300'}
                                        `}>
                                            {action.status === 'in_progress' ? (
                                                <LoadingDots className="text-blue-300" />
                                            ) : (
                                                action.status
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hint text */}
                <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-800/30">
                    Click to {isExpanded ? 'collapse' : 'expand'} action details
                </div>
            </div>
        </motion.div>
    );
}