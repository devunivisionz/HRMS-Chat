import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  type: 'channel' | 'dm' | 'group_dm';
  isPrivate: boolean;
  createdBy: string;
  memberIds: string[];
  pinnedIds: Schema.Types.ObjectId[];
  topic: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['channel', 'dm', 'group_dm'], required: true, index: true },
    isPrivate: { type: Boolean, default: false, index: true },
    createdBy: { type: String, required: true, index: true },
    memberIds: [{ type: String, index: true }],
    pinnedIds: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    topic: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'channels',
  }
);

ChannelSchema.index({ memberIds: 1 });
ChannelSchema.index({ type: 1, isPrivate: 1 });
ChannelSchema.index({ lastMessageAt: -1 });

export const Channel: Model<IChannel> =
  (mongoose.models.Channel as Model<IChannel>) ?? model<IChannel>('Channel', ChannelSchema);
