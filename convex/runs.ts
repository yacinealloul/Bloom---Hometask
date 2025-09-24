import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        chatId: v.id("chats"),
        sandboxId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const id = await ctx.db.insert("runs", {
            chatId: args.chatId,
            sandboxId: args.sandboxId,
            status: "ready",
            logs: "",
            previewUrl: undefined,
            createdAt: now,
            updatedAt: now,
            error: undefined,
        });
        return id;
    },
});

export const appendLogs = mutation({
    args: { runId: v.id("runs"), chunk: v.string() },
    handler: async (ctx, args) => {
        const run = await ctx.db.get(args.runId);
        if (!run) return;
        const logs = (run.logs ?? "") + args.chunk;
        await ctx.db.patch(args.runId, { logs, updatedAt: Date.now() });
    },
});

export const setStatus = mutation({
    args: {
        runId: v.id("runs"),
        status: v.union(
            v.literal("ready"),
            v.literal("running"),
            v.literal("failed"),
            v.literal("off")
        ),
        previewUrl: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.runId, {
            status: args.status,
            previewUrl: args.previewUrl,
            error: args.error,
            updatedAt: Date.now(),
        });
    },
});

export const listByChat = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("runs")
            .withIndex("by_chat", q => q.eq("chatId", args.chatId))
            .order("desc")
            .collect();
    },
});

export const get = query({
    args: { runId: v.id("runs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.runId);
    },
});

