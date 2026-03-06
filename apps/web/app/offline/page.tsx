export default function OfflinePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">You’re offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
