import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    url: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  model<INotification>('Notification', NotificationSchema);
