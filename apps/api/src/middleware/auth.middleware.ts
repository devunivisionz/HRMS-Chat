import type { RequestHandler } from 'express';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { AppError } from '@/lib/AppError';
import type { Role } from '@hrms/types';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token =
    req.cookies?.['sb-access-token'] ??
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) return next(new AppError('UNAUTHORIZED', 401));

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) return next(new AppError('INVALID_TOKEN', 401));

  const email = data.user.email;
  if (!email) return next(new AppError('INVALID_TOKEN', 401));

  const roleUnknown: unknown = (data.user.app_metadata as unknown as Record<string, unknown> | null | undefined)
    ?.role;
  const role: Role =
    roleUnknown === 'ADMIN' ||
    roleUnknown === 'HR' ||
    roleUnknown === 'MANAGER' ||
    roleUnknown === 'EMPLOYEE'
      ? roleUnknown
      : 'EMPLOYEE';

  req.user = {
    id: data.user.id,
    email,
    role,
  };

  return next();
};
