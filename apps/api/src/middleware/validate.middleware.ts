import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '@/lib/AppError';

export const validate = (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return next(new AppError('VALIDATION_ERROR', 400, message));
    }

    req.body = result.data;
    return next();
  };
