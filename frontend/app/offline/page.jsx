import { WifiOff } from "lucide-react";
import Link from "next/link";

import AmbientBackground from "@/components/common/AmbientBackground";
import { LogoTile } from "@/components/common/Logo";

export const metadata = {
  title: "Offline",
};

/** Served by the service worker when a navigation happens with no connection. */
export default function OfflinePage() {
  return (
    <div className="relative grid min-h-dvh place-items-center p-5">
      <AmbientBackground />
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <LogoTile size={56} className="mx-auto" />
        <h1 className="mt-6 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
          <WifiOff className="size-5 text-amber-400" />
          You are offline
        </h1>
        <p className="mt-2 text-sm text-foreground-500">
          Streamify needs a connection to stream music. Reconnect and your library will be right
          where you left it.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:brightness-95"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
