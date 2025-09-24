import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        title: v.string(),
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const chatId = await ctx.db.insert("chats", {
            title: args.title,
            userId: args.userId,
            createdAt: now,
            lastMessage: undefined,
        });
        return chatId;
    },
});

export const get = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.chatId);
    },
});

export const list = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.userId) {
            return await ctx.db
                .query("chats")
                .withIndex("by_user", q => q.eq("userId", args.userId))
                .order("desc")
                .collect();
        }
        return await ctx.db
            .query("chats")
            .withIndex("by_createdAt")
            .order("desc")
            .collect();
    },
});


