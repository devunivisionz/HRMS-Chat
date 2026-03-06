import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function LogoutPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
