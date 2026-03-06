import { isValidObjectId } from 'mongoose';

import { AppError } from '@/lib/AppError';
import { Channel } from '../../../models/Channel';
import { Message } from '../../../models/Message';

import type { ListChannelsQuery, ListMessagesQuery, SearchMessagesQuery, SendMessageInput } from './chat.schema';

type ChannelRow = {
  id: string;
  name: string;
  type: string;
  isPrivate: boolean;
  memberIds: string[];
  lastMessageAt: Date | null;
  createdAt: Date;
};

type ChannelDoc = {
  _id: unknown;
  name: string;
  type: string;
  isPrivate: boolean;
  memberIds: string[];
  lastMessageAt?: Date | null;
  createdAt: Date;
};

type MessageRow = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  contentType: string;
  parentId: string | null;
  attachments: unknown[];
  reactions: unknown[];
  mentions: string[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
};

type MessageDoc = {
  _id: unknown;
  channelId: unknown;
  senderId: string;
  content: string;
  contentType: string;
  parentId?: unknown;
  attachments?: unknown[];
  reactions?: unknown[];
  mentions?: string[];
  editedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
};

export class ChatService {
  public async listChannels(userId: string, query: ListChannelsQuery): Promise<{ data: ChannelRow[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const page = query.page;
    const limit = query.limit;

    const [data, total] = await Promise.all([
      Channel.find({ memberIds: userId })
        .sort({ lastMessageAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('name type isPrivate memberIds lastMessageAt createdAt')
        .lean()
        .exec(),
      Channel.countDocuments({ memberIds: userId }),
    ]);

    return {
      data: (data as unknown as ChannelDoc[]).map((d: ChannelDoc) => ({
        id: String(d._id),
        name: d.name,
        type: d.type,
        isPrivate: d.isPrivate,
        memberIds: d.memberIds,
        lastMessageAt: d.lastMessageAt ?? null,
        createdAt: d.createdAt,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  public async searchMessages(
    userId: string,
    query: SearchMessagesQuery
  ): Promise<{ data: MessageRow[]; nextCursor: string | null }> {
    const find: Record<string, unknown> = { deletedAt: null };

    if (query.channelId) {
      if (!isValidObjectId(query.channelId)) throw new AppError('INVALID_CHANNEL_ID', 400);
      const channel = await Channel.findById(query.channelId).select('memberIds').lean().exec();
      if (!channel) throw new AppError('NOT_FOUND', 404);
      if (!channel.memberIds.includes(userId)) throw new AppError('FORBIDDEN', 403);
      find.channelId = query.channelId;
    } else {
      const channels = await Channel.find({ memberIds: userId }).select('_id').lean().exec();
      find.channelId = { $in: (channels as unknown as Array<{ _id: unknown }>).map((c: { _id: unknown }) => c._id) };
    }

    if (query.cursor) {
      if (!isValidObjectId(query.cursor)) throw new AppError('INVALID_CURSOR', 400);
      find._id = { $lt: query.cursor };
    }

    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    find.content = { $regex: escaped, $options: 'i' };

    const msgs = await Message.find(find)
      .sort({ _id: -1 })
      .limit(query.limit)
      .select('channelId senderId content contentType parentId attachments reactions mentions editedAt deletedAt createdAt')
      .lean()
      .exec();

    const nextCursor = msgs.length > 0 ? String(msgs[msgs.length - 1]!._id) : null;

    return {
      data: (msgs as unknown as MessageDoc[]).map((m: MessageDoc) => ({
        id: String(m._id),
        channelId: String(m.channelId),
        senderId: m.senderId,
        content: m.content,
        contentType: m.contentType,
        parentId: m.parentId ? String(m.parentId) : null,
        attachments: m.attachments ?? [],
        reactions: m.reactions ?? [],
        mentions: m.mentions ?? [],
        editedAt: m.editedAt ?? null,
        deletedAt: m.deletedAt ?? null,
        createdAt: m.createdAt,
      })),
      nextCursor,
    };
  }

  public async listMessages(userId: string, query: ListMessagesQuery): Promise<{ data: MessageRow[]; nextCursor: string | null }> {
    if (!isValidObjectId(query.channelId)) throw new AppError('INVALID_CHANNEL_ID', 400);

    const channel = await Channel.findById(query.channelId).select('memberIds').lean().exec();
    if (!channel) throw new AppError('NOT_FOUND', 404);
    if (!channel.memberIds.includes(userId)) throw new AppError('FORBIDDEN', 403);

    const find: Record<string, unknown> = { channelId: query.channelId, deletedAt: null };
    if (query.cursor) {
      if (!isValidObjectId(query.cursor)) throw new AppError('INVALID_CURSOR', 400);
      find._id = { $lt: query.cursor };
    }

    const msgs = await Message.find(find)
      .sort({ _id: -1 })
      .limit(query.limit)
      .select('channelId senderId content contentType parentId attachments reactions mentions editedAt deletedAt createdAt')
      .lean()
      .exec();

    const nextCursor = msgs.length > 0 ? String(msgs[msgs.length - 1]!._id) : null;

    return {
      data: (msgs.reverse() as unknown as MessageDoc[]).map((m: MessageDoc) => ({
        id: String(m._id),
        channelId: String(m.channelId),
        senderId: m.senderId,
        content: m.content,
        contentType: m.contentType,
        parentId: m.parentId ? String(m.parentId) : null,
        attachments: m.attachments ?? [],
        reactions: m.reactions ?? [],
        mentions: m.mentions ?? [],
        editedAt: m.editedAt ?? null,
        deletedAt: m.deletedAt ?? null,
        createdAt: m.createdAt,
      })),
      nextCursor,
    };
  }

  public async sendMessage(userId: string, input: SendMessageInput): Promise<MessageRow> {
    if (!isValidObjectId(input.channelId)) throw new AppError('INVALID_CHANNEL_ID', 400);

    const channel = await Channel.findById(input.channelId).select('memberIds').lean().exec();
    if (!channel) throw new AppError('NOT_FOUND', 404);
    if (!channel.memberIds.includes(userId)) throw new AppError('FORBIDDEN', 403);

    const created = await Message.create({
      channelId: input.channelId,
      senderId: userId,
      content: input.content,
      contentType: input.contentType,
      parentId: input.parentId ?? null,
      attachments: input.attachments ?? [],
      reactions: [],
      mentions: input.mentions ?? [],
      editedAt: null,
      deletedAt: null,
    });

    await Channel.updateOne({ _id: input.channelId }, { $set: { lastMessageAt: new Date() } }).exec();

    return {
      id: String(created._id),
      channelId: String(created.channelId),
      senderId: created.senderId,
      content: created.content,
      contentType: created.contentType,
      parentId: created.parentId ? String(created.parentId) : null,
      attachments: created.attachments as unknown[],
      reactions: created.reactions as unknown[],
      mentions: created.mentions,
      editedAt: created.editedAt,
      deletedAt: created.deletedAt,
      createdAt: created.createdAt,
    };
  }
}
