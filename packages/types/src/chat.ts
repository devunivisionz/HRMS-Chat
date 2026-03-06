import { z } from 'zod';

export const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const reactionSchema = z.object({
  emoji: z.string().min(1),
  userIds: z.array(z.string().uuid()),
});
export type Reaction = z.infer<typeof reactionSchema>;

export const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['channel', 'dm', 'group_dm']),
  isPrivate: z.boolean(),
  createdBy: z.string().uuid(),
  memberIds: z.array(z.string().uuid()),
  pinnedIds: z.array(z.string()).optional(),
  topic: z.string().optional(),
  lastMessageAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }),
});
export type Channel = z.infer<typeof channelSchema>;

export const messageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  senderId: z.string().uuid(),
  content: z.string(),
  contentType: z.enum(['text', 'file', 'system']),
  parentId: z.string().nullable().optional(),
  attachments: z.array(attachmentSchema).optional(),
  reactions: z.array(reactionSchema).optional(),
  mentions: z.array(z.string().uuid()).optional(),
  editedAt: z.string().datetime({ offset: true }).nullable().optional(),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  createdAt: z.string().datetime({ offset: true }),
});
export type Message = z.infer<typeof messageSchema>;
