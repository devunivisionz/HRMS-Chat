import type { RequestHandler } from 'express';

import { AppError } from '@/lib/AppError';
import type { Role } from '@hrms/types';

export const requireRole = (allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHORIZED', 401));
    if (!allowed.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'));
    }
    return next();
  };
