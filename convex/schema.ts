import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  pushTokens: defineTable({
    subject: v.string(),
    pushToken: v.string(),
  }).index('by_subject', ['subject']),
});
