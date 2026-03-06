import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

function connectionOptions(): { host: string; port: number; password?: string } {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port || '6379'),
    password: url.password || undefined,
  };
}

export const notificationsQueue = new Queue('notifications', {
  connection: connectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const payrollQueue = new Queue('payroll', {
  connection: connectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const reportsQueue = new Queue('reports', {
  connection: connectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
