import { createClient } from '@supabase/supabase-js';

import { notificationsQueue } from '@/lib/bull';
import { AppError } from '@/lib/AppError';
import { Notification } from '../../../models/Notification';
import { PushSubscription } from '../../../models/PushSubscription';

import type { NotificationType, PaginatedResponse, PushSubscription as PushSubscriptionType } from '@hrms/types';

type NotificationPayload = {
  title: string;
  body?: string;
  url?: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function supabaseRealtimeClient() {
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set');
  if (!supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY is not set');
  return createClient(supabaseUrl, supabaseAnonKey);
}

export class NotificationService {
  public async subscribe(
    userId: string,
    subscription: PushSubscriptionType,
    platform: 'web' | 'android' | 'ios' | 'unknown',
    userAgent?: string
  ): Promise<{ id: string }> {
    const created = await PushSubscription.create({
      userId,
      subscription,
      platform,
      userAgent: userAgent ?? '',
      lastUsed: new Date(),
    });

    return { id: String(created._id) };
  }

  public async unsubscribe(userId: string, endpoint: string): Promise<{ deleted: number }> {
    const result = await PushSubscription.deleteMany({ userId, 'subscription.endpoint': endpoint }).exec();
    return { deleted: result.deletedCount ?? 0 };
  }

  public async send(userId: string, type: NotificationType, payload: NotificationPayload): Promise<{ id: string }> {
    const created = await Notification.create({
      userId,
      type,
      title: payload.title,
      body: payload.body ?? '',
      url: payload.url ?? null,
      isRead: false,
    });

    const supabase = supabaseRealtimeClient();
    await supabase.channel(`notifications:${userId}`).send({
      type: 'broadcast',
      event: 'INSERT',
      payload: {
        id: String(created._id),
        userId,
        type,
        title: payload.title,
        body: payload.body ?? '',
        url: payload.url ?? null,
        isRead: false,
        createdAt: created.createdAt,
      },
    });

    await Promise.all([
      notificationsQueue.add('push', { userId, type, payload }),
      notificationsQueue.add('email', { userId, type, payload }),
    ]);

    return { id: String(created._id) };
  }

  public async getNotifications(
    userId: string,
    page: number,
    limit = 20
  ): Promise<PaginatedResponse<{ id: string; type: string; title: string; body: string; url: string | null; isRead: boolean; createdAt: Date }>> {
    const [data, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('type title body url isRead createdAt')
        .lean()
        .exec(),
      Notification.countDocuments({ userId }),
    ]);

    return {
      data: data.map((d) => ({
        id: String(d._id),
        type: d.type,
        title: d.title,
        body: d.body,
        url: d.url ?? null,
        isRead: d.isRead,
        createdAt: d.createdAt,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  public async markRead(id: string, userId: string): Promise<{ id: string }> {
    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true }
    )
      .select('_id')
      .lean()
      .exec();

    if (!updated) throw new AppError('NOT_FOUND', 404);
    return { id: String(updated._id) };
  }

  public async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } }).exec();
    return { updated: result.modifiedCount };
  }
}
