import Logo from "./Logo";

/**
 * Shown when the Firebase env vars are missing.
 *
 * A blank screen here is the single most confusing failure mode of a fresh
 * deploy, so the app explains exactly which keys to set and where.
 */
export default function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="glass w-full max-w-lg rounded-3xl p-6 sm:p-8">
        <Logo size={30} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Connect Firebase to continue</h1>
        <p className="mt-2 text-sm text-foreground-500">
          Streamify signs users in with Google through Firebase. Add your project keys to the
          environment and restart — no code changes needed.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-foreground-400">
          {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}
        </pre>
        <p className="mt-4 text-xs text-foreground-500">
          Locally these live in{" "}
          <code className="text-foreground-400">frontend/.env.local</code>; on Render they are
          service environment variables.
        </p>
      </div>
    </div>
  );
}
