import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string };
}): Promise<React.ReactElement> {
  const code = searchParams.code;
  if (!code) redirect('/login');

  const supabase = createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(code);

  redirect('/dashboard');
}
