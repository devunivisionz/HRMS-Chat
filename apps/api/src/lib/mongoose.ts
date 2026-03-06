import mongoose from 'mongoose';

import { logger } from '@/lib/logger';

let connectPromise: Promise<typeof mongoose> | null = null;

async function connectOnce(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri);
}

async function connectWithRetry(uri: string, maxRetries: number): Promise<typeof mongoose> {
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const conn = await connectOnce(uri);
      logger.info({ msg: 'MongoDB connected', attempt });
      return conn;
    } catch (err: unknown) {
      lastErr = err;
      logger.error({ msg: 'MongoDB connection failed', attempt, err });
      await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 5000)));
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('MongoDB connection failed');
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  if (!connectPromise) {
    connectPromise = connectWithRetry(uri, 5);
  }

  return connectPromise;
}
