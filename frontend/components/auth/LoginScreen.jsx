"use client";

import { Headphones, ListMusic, Sparkles, WifiOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AmbientBackground from "@/components/common/AmbientBackground";
import { LogoTile } from "@/components/common/Logo";
import SetupNotice from "@/components/common/SetupNotice";
import Google from "@/components/icons/Google";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, APP_TAGLINE } from "@/lib/site";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Made for you",
    body: "Recommendations that learn from what you actually play.",
  },
  {
    icon: ListMusic,
    title: "Playlists",
    body: "Build collections, like songs, keep it all in sync.",
  },
  {
    icon: WifiOff,
    title: "Install it",
    body: "Add it to your home screen and it behaves like a native app.",
  },
  {
    icon: Headphones,
    title: "Free and ad-free",
    body: "Stream and download millions of songs, no interruptions.",
  },
];

export default function LoginScreen() {
  const { status, user, signIn, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const [isSigningIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (status === "ready" && user) router.replace(next);
  }, [status, user, router, next]);

  if (status === "unconfigured") return <SetupNotice />;

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AmbientBackground />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-5 py-10 lg:flex-row lg:gap-16 lg:py-16">
        <div className="animate-rise flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
          <LogoTile size={68} className="mb-6" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{APP_NAME}</h1>
          <p className="mt-3 text-base text-foreground-500 sm:text-lg">{APP_TAGLINE}</p>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn || status !== "ready"}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-foreground text-[15px] font-semibold text-background shadow-xl transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60 sm:max-w-sm"
          >
            <Google className="size-5" />
            {isSigningIn ? "Signing you in…" : "Continue with Google"}
          </button>

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

          <p className="mt-5 max-w-sm text-xs leading-relaxed text-foreground-500">
            An educational project. Music streams from a public third-party API — nothing is stored
            or redistributed.
          </p>
        </div>

        <ul className="animate-rise grid w-full max-w-md gap-3 sm:grid-cols-2 lg:max-w-lg">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="glass-card rounded-2xl p-4">
              <feature.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold tracking-tight">{feature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground-500">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
