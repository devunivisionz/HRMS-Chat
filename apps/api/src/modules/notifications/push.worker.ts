import webpush from 'web-push';
import { Worker } from 'bullmq';

import { logger } from '@/lib/logger';

import { PushSubscription } from '../../../models/PushSubscription';

type PushJobData = {
  userId: string;
  type: string;
  payload: {
    title: string;
    body?: string;
    url?: string;
  };
};

type SubscriptionDoc = {
  userId: string;
  subscription: { endpoint?: unknown };
};

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export function startPushWorker(connection: { host: string; port: number; password?: string }): Worker {
  return new Worker(
    'notifications',
    async (job) => {
      if (job.name !== 'push') return;

      const data = job.data as PushJobData;
      const subs = (await PushSubscription.find({ userId: data.userId }).lean().exec()) as unknown as SubscriptionDoc[];

      await Promise.all(
        subs.map(async (doc) => {
          try {
            await webpush.sendNotification(
              doc.subscription as unknown as webpush.PushSubscription,
              JSON.stringify({
                title: data.payload.title,
                body: data.payload.body,
                url: data.payload.url,
              })
            );
          } catch (err: unknown) {
            const e = err as { statusCode?: number };
            if (e.statusCode === 404 || e.statusCode === 410) {
              const endpoint = doc.subscription.endpoint;
              if (typeof endpoint === 'string') {
                await PushSubscription.deleteMany({
                  userId: data.userId,
                  'subscription.endpoint': endpoint,
                }).exec();
              }
            }
            throw err;
          }
        })
      );
    },
    {
      connection,
      concurrency: 5,
    }
  ).on('failed', (job, err) => {
    logger.error({ msg: 'push worker job failed', jobId: job?.id, err });
  });
}
