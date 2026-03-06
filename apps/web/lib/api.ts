import axios from 'axios';

import { createSupabaseBrowserClient } from '@/lib/supabase';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    return Promise.reject(error);
  }
);
