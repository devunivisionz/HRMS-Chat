'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword(values);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your work email</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email?.message ? (
          <p className="text-sm text-destructive dark:text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
        {form.formState.errors.password?.message ? (
          <p className="text-sm text-destructive dark:text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive dark:text-destructive">{error}</p> : null}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
