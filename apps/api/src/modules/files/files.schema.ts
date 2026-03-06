import { z } from 'zod';

export const signDownloadUrlSchema = z.object({
  path: z.string().min(1),
});

export type SignDownloadUrlInput = z.infer<typeof signDownloadUrlSchema>;
