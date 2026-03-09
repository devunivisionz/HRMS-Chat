import type { RequestHandler } from 'express';

import { AuditLog } from '../../models/AuditLog';

export const auditLog = (action: string): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.user) return next();

      await AuditLog.create({
        actorId: req.user.id,
        action,
        targetId: String(req.params.id) ?? null,
        meta: {
          method: req.method,
          url: req.originalUrl,
        },
      });

      return next();
    } catch (err) {
      return next(err);
    }
  };
