import path from 'node:path';

import { fileTypeFromBuffer } from 'file-type';

import { AppError } from '@/lib/AppError';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'hrms-private';

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function ensureAllowedMime(mime: string): void {
  const allowed = new Set<string>([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
  ]);
  if (!allowed.has(mime)) throw new AppError('UNSUPPORTED_FILE_TYPE', 400, 'Unsupported file type');
}

export class FilesService {
  public async uploadPrivate(params: {
    folder: string;
    originalName: string;
    bytes: Buffer;
    userId: string;
  }): Promise<{ path: string; mimeType: string; size: number }> {
    const detected = await fileTypeFromBuffer(params.bytes);
    const mimeType = detected?.mime ?? 'application/octet-stream';

    ensureAllowedMime(mimeType);

    const safeName = sanitizeFilename(params.originalName);
    const objectPath = `${params.folder}/${params.userId}/${Date.now()}_${safeName}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(objectPath, params.bytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw new AppError('UPLOAD_FAILED', 500, error.message);

    return { path: objectPath, mimeType, size: params.bytes.length };
  }

  public async signPrivateDownloadUrl(filePath: string, expiresInSeconds = 60): Promise<{ url: string }> {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(filePath, expiresInSeconds);
    if (error || !data?.signedUrl) throw new AppError('SIGNED_URL_FAILED', 500, error?.message ?? 'Failed to create signed URL');
    return { url: data.signedUrl };
  }
}
