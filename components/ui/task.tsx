'use client';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, SearchIcon, CheckCircleIcon, CircleIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TaskItemFileProps = ComponentProps<'div'>;

export const TaskItemFile = ({
    children,
    className,
    ...props
}: TaskItemFileProps) => (
    <div
        className={cn(
            'inline-flex items-center gap-1 rounded-md file-badge px-1.5 py-0.5 text-foreground text-xs font-mono',
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

export type TaskItemProps = ComponentProps<'div'> & {
    status?: 'pending' | 'in_progress' | 'completed' | 'failed';
};

const statusIcons = {
    pending: CircleIcon,
    in_progress: Loader2Icon,
    completed: CheckCircleIcon,
    failed: XCircleIcon,
};

const statusColors = {
    pending: 'text-muted-foreground',
    in_progress: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
};

export const TaskItem = ({ children, className, status = 'pending', ...props }: TaskItemProps) => {
    const StatusIcon = statusIcons[status];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn('flex items-center gap-2 text-sm', className)}
            {...props}
        >
            <StatusIcon
                className={cn(
                    'size-4 shrink-0 transition-colors duration-200',
                    statusColors[status],
                    status === 'in_progress' && 'animate-spin'
                )}
            />
            <span className={cn(
                'transition-colors duration-200',
                status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
            )}>
                {children}
            </span>
        </motion.div>
    );
};

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
    defaultOpen = true,
    className,
    ...props
}: TaskProps) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
        <Collapsible
            className={cn(
                'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=open]:animate-in',
                className,
            )}
            defaultOpen={defaultOpen}
            {...props}
        />
    </motion.div>
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
    title: string;
};

export const TaskTrigger = ({
    children,
    className,
    title,
    ...props
}: TaskTriggerProps) => (
    <CollapsibleTrigger asChild className={cn('group', className)} {...props}>
        {children ?? (
            <div className="task-trigger flex cursor-pointer w-full items-center justify-between gap-3 text-muted-foreground text-sm py-1">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{title}</p>
                </div>
                <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </div>
        )}
    </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
    children,
    className,
    ...props
}: TaskContentProps) => (
    <CollapsibleContent
        className={cn(
            'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
        )}
        {...props}
    >
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-4 space-y-3 border-muted border-l-2 pl-4"
        >
            <AnimatePresence mode="popLayout">
                {children}
            </AnimatePresence>
        </motion.div>
    </CollapsibleContent>
);
