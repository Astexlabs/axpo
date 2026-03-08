import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();
  },
});

export const upsert = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email,
        name: identity.name,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
    });
  },
});

export const savePushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, { pushToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (!user) throw new Error('User not found');

    await ctx.db.patch(user._id, { pushToken });
  },
});
