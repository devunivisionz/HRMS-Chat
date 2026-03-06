import { Router } from 'express';

import { authLimiter } from '@/middleware/rateLimit.middleware';
import { validate } from '@/middleware/validate.middleware';
import { loginSchema } from './auth.schema';
import { AuthService } from './auth.service';

const router = Router();
const service = new AuthService();

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const tokens = await service.login(req.body);
    return res.json({ success: true, data: tokens });
  } catch (err) {
    return next(err);
  }
});

export { router as authRouter };
