import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: string;
  action: string;
  targetId: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetId: { type: String, default: null, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1 });

export const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ?? model<IAuditLog>('AuditLog', AuditLogSchema);
