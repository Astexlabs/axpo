import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const currentIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      pictureUrl: identity.pictureUrl,
    };
  },
});

export const savePushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, { pushToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_subject', (q) => q.eq('subject', identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { pushToken });
      return existing._id;
    }

    return await ctx.db.insert('pushTokens', {
      subject: identity.subject,
      pushToken,
    });
  },
});
