import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
    args: {
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        createdAt: v.optional(v.number()),
        isStreaming: v.optional(v.boolean()),
        type: v.optional(v.union(
            v.literal("standard"),
            v.literal("plan"),
            v.literal("action_status"),
            v.literal("summary")
        )),
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
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            type: v.optional(v.string()),
            size: v.optional(v.number()),
            path: v.optional(v.string()),
            url: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        const now = args.createdAt || Date.now();
        const id = await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: args.role,
            content: args.content,
            isStreaming: args.isStreaming,
            type: args.type || "standard",
            thoughts: args.thoughts,
            actions: args.actions,
            attachments: args.attachments,
            createdAt: now,
        });
        // keep lastMessage denormalized on chat for sidebar
        await ctx.db.patch(args.chatId, { lastMessage: args.content.slice(0, 200) });
        return id;
    },
});

export const listByChat = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_chat_createdAt", q => q.eq("chatId", args.chatId))
            .order("asc")
            .collect();
    },
});

export const setStreaming = mutation({
    args: { messageId: v.id("messages"), isStreaming: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, { isStreaming: args.isStreaming });
    },
});

export const appendContent = mutation({
    args: { messageId: v.id("messages"), delta: v.string() },
    handler: async (ctx, args) => {
        const m = await ctx.db.get(args.messageId);
        if (!m) return;
        const content = (m.content || "") + args.delta;
        await ctx.db.patch(args.messageId, { content });
    },
});

export const update = mutation({
    args: {
        id: v.id("messages"),
        content: v.optional(v.string()),
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
        })))
    },
    handler: async (ctx, args) => {
        const updates: any = {};
        if (args.content !== undefined) updates.content = args.content;
        if (args.thoughts !== undefined) updates.thoughts = args.thoughts;
        if (args.actions !== undefined) updates.actions = args.actions;

        await ctx.db.patch(args.id, updates);
    },
});



