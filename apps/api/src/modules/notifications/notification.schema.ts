import { pushSubscriptionSchema } from '@hrms/types';
import { z } from 'zod';

export const subscribeSchema = z.object({
  subscription: pushSubscriptionSchema,
  platform: z.enum(['web', 'android', 'ios', 'unknown']).default('unknown'),
  userAgent: z.string().max(500).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
