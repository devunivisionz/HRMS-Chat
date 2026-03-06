import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'LEAVE_REQUEST_SUBMITTED',
  'LEAVE_APPROVED',
  'LEAVE_REJECTED',
  'PAYSLIP_READY',
  'MENTION',
  'DM_RECEIVED',
  'ATTENDANCE_REMINDER',
  'PERFORMANCE_REVIEW_DUE',
  'NEW_EMPLOYEE_ONBOARDED',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string().optional(),
  url: z.string().optional(),
  isRead: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});
export type Notification = z.infer<typeof notificationSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
