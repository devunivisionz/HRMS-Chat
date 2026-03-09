import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { connectMongo } from '@/lib/mongoose';
import { AppError } from '@/lib/AppError';
import { logger } from '@/lib/logger';
import { generalLimiter } from '@/middleware/rateLimit.middleware';
import { authRouter } from '@/modules/auth/auth.routes';
import { attendanceRouter } from '@/modules/attendance/attendance.routes';
import { chatRouter } from '@/modules/chat/chat.routes';
import { employeeRouter } from '@/modules/employees/employee.routes';
import { leaveRouter } from '@/modules/leaves/leave.routes';
import { filesRouter } from '@/modules/files/files.routes';
import { notificationRouter } from '@/modules/notifications/notification.routes';
import { startEmailWorker } from '@/modules/notifications/email.worker';
import { startPushWorker } from '@/modules/notifications/push.worker';
import { payrollRouter } from '@/modules/payroll/payroll.routes';
import { startPayrollWorker } from '@/modules/payroll/payroll.worker';
import { performanceRouter } from '@/modules/performance/performance.routes';
import { recruitmentRouter } from '@/modules/recruitment/recruitment.routes';
import { registerChatGateway } from '@/modules/chat/chat.gateway';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
);

app.use(morgan('combined'));
app.use(generalLimiter);

app.get('/api/health', (_req, res) => res.json({ success: true, data: { ok: true } }));

app.use('/auth', authRouter);
app.use('/employees', employeeRouter);
app.use('/files', filesRouter);
app.use('/attendance', attendanceRouter);
app.use('/leaves', leaveRouter);
app.use('/payroll', payrollRouter);
app.use('/performance', performanceRouter);
app.use('/recruitment', recruitmentRouter);
app.use('/chat', chatRouter);
app.use('/notifications', notificationRouter);

app.use((_req, _res, next) => next(new AppError('NOT_FOUND', 404, 'Not found')));

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
  }

  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const pErr = err as unknown as { code?: string };
    if (pErr.code === 'P2002') {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' } });
    }
  }

  logger.error({ err, url: req.url });
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
});

const server = http.createServer(app);

export async function createServer(): Promise<http.Server> {
  await connectMongo();

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    },
  });

  registerChatGateway(io);

  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const connection = {
    host: url.hostname,
    port: Number(url.port || '6379'),
    password: url.password || undefined,
  };

  startPushWorker(connection);
  startEmailWorker(connection);
  startPayrollWorker(connection);

  return server;
}

if (require.main === module) {
  void createServer().then(() => {
    const port = Number(process.env.PORT ?? '4000');
    server.listen(port, () => {
      logger.info({ msg: 'API listening', port });
    });
  });
}
