import { LoginForm } from './LoginForm';

export default function LoginPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
