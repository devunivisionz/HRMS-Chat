import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function MePage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect('/login');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="text-sm font-medium">{data.user.email ?? '-'}</p>
      </div>
    </div>
  );
}
