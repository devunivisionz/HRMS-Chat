import { z } from 'zod';

export const objectIdSchema = z.string().min(1);

export const listChannelsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type ListChannelsQuery = z.infer<typeof listChannelsSchema>;

export const listMessagesSchema = z.object({
  channelId: objectIdSchema,
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
});
export type ListMessagesQuery = z.infer<typeof listMessagesSchema>;

export const searchMessagesSchema = z.object({
  q: z.string().min(1).max(200),
  channelId: objectIdSchema.optional(),
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type SearchMessagesQuery = z.infer<typeof searchMessagesSchema>;

export const sendMessageSchema = z.object({
  channelId: objectIdSchema,
  content: z.string().max(5000).default(''),
  contentType: z.enum(['text', 'file', 'system']).default('text'),
  parentId: objectIdSchema.nullable().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1).max(255),
        size: z.number().int().nonnegative(),
        mimeType: z.string().min(1).max(255),
      })
    )
    .optional(),
  mentions: z.array(z.string().uuid()).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const typingSchema = z.object({
  channelId: objectIdSchema,
  isTyping: z.boolean(),
});
export type TypingInput = z.infer<typeof typingSchema>;

export const presencePingSchema = z.object({
  status: z.enum(['online', 'away']).default('online'),
});
export type PresencePingInput = z.infer<typeof presencePingSchema>;
