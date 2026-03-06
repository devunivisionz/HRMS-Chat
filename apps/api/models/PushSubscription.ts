import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  subscription: Record<string, unknown>;
  platform: 'web' | 'android' | 'ios' | 'unknown';
  userAgent: string;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    subscription: { type: Schema.Types.Mixed, required: true },
    platform: { type: String, enum: ['web', 'android', 'ios', 'unknown'], default: 'unknown' },
    userAgent: { type: String, default: '' },
    lastUsed: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'push_subscriptions',
  }
);

PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

export const PushSubscription: Model<IPushSubscription> =
  (mongoose.models.PushSubscription as Model<IPushSubscription>) ??
  model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
