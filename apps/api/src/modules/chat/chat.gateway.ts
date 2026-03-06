import type { Server } from 'socket.io';

import { isValidObjectId } from 'mongoose';

import { AppError } from '@/lib/AppError';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Channel } from '../../../models/Channel';
import { ChatService } from './chat.service';
import { presencePingSchema, sendMessageSchema, typingSchema } from './chat.schema';

type AuthedSocketUser = {
  id: string;
};

function roomForChannel(channelId: string): string {
  return `channel:${channelId}`;
}

function presenceKey(userId: string): string {
  return `presence:${userId}`;
}

async function verifyJwt(token: string): Promise<AuthedSocketUser> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new AppError('UNAUTHORIZED', 401);
  return { id: data.user.id };
}

export function registerChatGateway(io: Server): void {
  const service = new ChatService();

  const nsp = io.of('/chat');

  nsp.use(async (socket, next) => {
    try {
      const token =
        (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined) ??
        (typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization.replace('Bearer ', '')
          : undefined);

      if (!token) return next(new AppError('UNAUTHORIZED', 401));

      const user = await verifyJwt(token);
      (socket.data as { user?: AuthedSocketUser }).user = user;
      return next();
    } catch (err) {
      return next(err as Error);
    }
  });

  const typingStopTimers = new Map<string, NodeJS.Timeout>();
  const typingThrottle = new Map<string, number>();

  nsp.on('connection', async (socket) => {
    const user = (socket.data as { user?: AuthedSocketUser }).user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const channels = await Channel.find({ memberIds: user.id }).select('_id').lean().exec();
    await Promise.all(channels.map(async (c) => socket.join(roomForChannel(String(c._id)))));

    await redis.set(presenceKey(user.id), 'online', 'EX', 30);
    nsp.emit('presence:update', { userId: user.id, status: 'online' });

    socket.on('message:send', async (payload, ack) => {
      try {
        const parsed = sendMessageSchema.parse(payload);
        const msg = await service.sendMessage(user.id, parsed);
        nsp.to(roomForChannel(parsed.channelId)).emit('message:new', msg);
        if (typeof ack === 'function') ack({ success: true, data: msg });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, error: { code: 'SEND_FAILED', message: (err as Error).message } });
      }
    });

    socket.on('typing:start', async (payload) => {
      const parsed = typingSchema.parse({ ...payload, isTyping: true });
      if (!isValidObjectId(parsed.channelId)) return;

      const key = `${user.id}:${parsed.channelId}`;
      const now = Date.now();
      const last = typingThrottle.get(key) ?? 0;
      if (now - last < 2000) return;
      typingThrottle.set(key, now);

      nsp.to(roomForChannel(parsed.channelId)).emit('typing:update', {
        channelId: parsed.channelId,
        userId: user.id,
        isTyping: true,
      });

      const t = typingStopTimers.get(key);
      if (t) clearTimeout(t);
      typingStopTimers.set(
        key,
        setTimeout(() => {
          nsp.to(roomForChannel(parsed.channelId)).emit('typing:update', {
            channelId: parsed.channelId,
            userId: user.id,
            isTyping: false,
          });
        }, 3000)
      );
    });

    socket.on('typing:stop', async (payload) => {
      const parsed = typingSchema.parse({ ...payload, isTyping: false });
      if (!isValidObjectId(parsed.channelId)) return;

      const key = `${user.id}:${parsed.channelId}`;
      const t = typingStopTimers.get(key);
      if (t) clearTimeout(t);
      typingStopTimers.set(
        key,
        setTimeout(() => {
          nsp.to(roomForChannel(parsed.channelId)).emit('typing:update', {
            channelId: parsed.channelId,
            userId: user.id,
            isTyping: false,
          });
        }, 3000)
      );
    });

    socket.on('presence:ping', async (payload) => {
      const parsed = presencePingSchema.parse(payload ?? {});
      await redis.set(presenceKey(user.id), parsed.status, 'EX', 30);
      nsp.emit('presence:update', { userId: user.id, status: parsed.status });
    });

    socket.on('disconnect', async () => {
      await redis.del(presenceKey(user.id));
      nsp.emit('presence:update', { userId: user.id, status: 'offline' });
    });
  });
}
