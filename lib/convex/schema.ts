import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  }),
  messages: defineTable({
    channelId: v.id("channels"),
    content: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_author", ["authorId"]),
});


export default schema;