import React from "react";
import StandardMessage from "./messages/standard-message";
import ActionStatusMessage from "./messages/action-status-message";
import PlanMessage from "./messages/plan-message";
import SummaryMessage from "./messages/summary-message";

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

interface Attachment {
    name: string;
    type?: string;
    size?: number;
    path?: string;
    url?: string;
}

interface Message {
    _id: string;
    role: "user" | "assistant" | "system";
    content: string;
    type?: "standard" | "plan" | "action_status" | "summary";
    thoughts?: string;
    actions?: Action[];
    attachments?: Attachment[];
}

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    // Filter out empty/unwanted messages
    if (
        !message.content?.trim() &&
        !message.thoughts?.trim() &&
        (!message.actions || message.actions.length === 0)
    ) {
        return null;
    }

    // Route to appropriate component based on message type
    switch (message.type) {
        case "plan":
            return <PlanMessage content={message.content} />;

        case "action_status":
            return (
                <ActionStatusMessage
                    thoughts={message.thoughts || ""}
                    actions={message.actions || []}
                />
            );

        case "summary":
            return <SummaryMessage content={message.content} />;

        default:
            return (
                <StandardMessage
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments}
                />
            );
    }
}
