import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    chats: defineTable({
        title: v.string(),
        createdAt: v.number(),
        // optional user identifier if you add auth later
        userId: v.optional(v.string()),
        // last message preview for the sidebar
        lastMessage: v.optional(v.string()),
    }).index("by_user", ["userId"]).index("by_createdAt", ["createdAt"]),

    messages: defineTable({
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        createdAt: v.number(),
        // for streaming UI; when true the message may still update
        isStreaming: v.optional(v.boolean()),
        // message type for better rendering
        type: v.optional(v.union(
            v.literal("standard"),
            v.literal("plan"),
            v.literal("action_status"),
            v.literal("summary")
        )),
        // for action_status messages
        thoughts: v.optional(v.string()),
        actions: v.optional(v.array(v.object({
            type: v.string(),
            path: v.optional(v.string()),
            command: v.optional(v.string()),
            background: v.optional(v.boolean()),
            recursive: v.optional(v.boolean()),
            depth: v.optional(v.number()),
            status: v.string(),
            pkg: v.optional(v.string()),
            packages: v.optional(v.array(v.string())),
            dev: v.optional(v.boolean()),
        }))),
        // optional attachment metadata
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            type: v.optional(v.string()),
            size: v.optional(v.number()),
            path: v.optional(v.string(),), // path inside sandbox
            url: v.optional(v.string()),   // external URL if any
        }))),
    })
        .index("by_chat", ["chatId"])
        .index("by_chat_createdAt", ["chatId", "createdAt"]),

    runs: defineTable({
        chatId: v.id("chats"),
        // a2b/e2b sandbox session id
        sandboxId: v.string(),
        status: v.string(),
        logs: v.optional(v.string()),
        previewUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        error: v.optional(v.string()),
    }).index("by_chat", ["chatId"]).index("by_createdAt", ["createdAt"]),
});

