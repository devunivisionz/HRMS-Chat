import { AppError } from '@/lib/AppError';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { LoginInput } from './auth.schema';

export class AuthService {
  public async login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }
}
