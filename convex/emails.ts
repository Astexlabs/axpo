'use node';

import { v } from 'convex/values';
import { Resend } from 'resend';
import { action, internalAction } from './_generated/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export const send = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return data?.id;
  },
});

export const sendWelcome = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
  },
  handler: async (_ctx, { to, name }) => {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Welcome to Axpo',
      html: `<h1>Welcome, ${name}!</h1><p>Thanks for joining us.</p>`,
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return data?.id;
  },
});
