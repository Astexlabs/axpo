import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const upsertToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, { pushToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const clerkUserId = identity.subject;

    const existing = await ctx.db
      .query('device_tokens')
      .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', clerkUserId))
      .collect();

    const match = existing.find((t) => t.pushToken === pushToken);
    if (match) return match._id;

    return await ctx.db.insert('device_tokens', { clerkUserId, pushToken });
  },
});

export const removeToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, { pushToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const token = await ctx.db
      .query('device_tokens')
      .withIndex('by_push_token', (q) => q.eq('pushToken', pushToken))
      .unique();

    if (token && token.clerkUserId === identity.subject) {
      await ctx.db.delete(token._id);
    }
  },
});

export const getTokensForUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query('device_tokens')
      .withIndex('by_clerk_user_id', (q) => q.eq('clerkUserId', clerkUserId))
      .collect();
  },
});
