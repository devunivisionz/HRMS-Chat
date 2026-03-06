import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

type Attachment = { url: string; name: string; size: number; mimeType: string };

type Reaction = { emoji: string; userIds: string[] };

export interface IMessage extends Document {
  channelId: Schema.Types.ObjectId;
  senderId: string;
  content: string;
  contentType: 'text' | 'file' | 'system';
  parentId: Schema.Types.ObjectId | null;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: string[];
  editHistory: { content: string; editedAt: Date }[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, default: '' },
    contentType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    attachments: [{ url: String, name: String, size: Number, mimeType: String }],
    reactions: [{ emoji: String, userIds: [String] }],
    mentions: [{ type: String }],
    editHistory: [{ content: String, editedAt: Date }],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ mentions: 1 });
MessageSchema.index({ deletedAt: 1 });

export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ?? model<IMessage>('Message', MessageSchema);
