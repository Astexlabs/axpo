import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  device_tokens: defineTable({
    clerkUserId: v.string(),
    pushToken: v.string(),
  })
    .index('by_clerk_user_id', ['clerkUserId'])
    .index('by_push_token', ['pushToken']),
});
