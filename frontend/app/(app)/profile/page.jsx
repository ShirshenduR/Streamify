"use client";

import { cn } from "@heroui/react";
import { Clock, Heart, LogOut, ListMusic, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import InstallPrompt from "@/components/common/InstallPrompt";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { initialsOf, pluralize } from "@/lib/format";
import { useClearHistory, useHistory, useLikedSongs, usePlaylists } from "@/lib/queries";
import { gradientFor } from "@/lib/site";

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-xs text-foreground-500">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, uid, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const history = useHistory(uid, 500);
  const liked = useLikedSongs(uid);
  const playlists = usePlaylists(uid);
  const clearHistory = useClearHistory(uid);

  const stats = useMemo(() => {
    const songs = history.data?.songs ?? [];
    const totalPlays = songs.reduce((sum, song) => sum + (Number(song.playCount) || 0), 0);

    const artistTotals = new Map();
    for (const song of songs) {
      for (const raw of String(song.artist || "").split(",")) {
        const artist = raw.trim();
        if (!artist) continue;
        artistTotals.set(artist, (artistTotals.get(artist) || 0) + (Number(song.playCount) || 1));
      }
    }
    const topArtists = [...artistTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { totalPlays, uniqueTracks: songs.length, topArtists };
  }, [history.data]);

  const topCount = stats.topArtists[0]?.[1] ?? 0;

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync();
      toast.success("Listening history cleared");
    } catch (error) {
      toast.error(error?.message || "Could not clear the history.");
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-5 sm:pt-7">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="size-24 rounded-full object-cover shadow-xl ring-1 ring-white/10 sm:size-28"
          />
        ) : (
          <span className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-bold text-white shadow-xl sm:size-28">
            {initialsOf(user?.displayName || user?.email || "?")}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {user?.displayName || "Listener"}
          </h1>
          <p className="truncate text-sm text-foreground-500">{user?.email}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Clock} value={stats.totalPlays} label="Total plays" />
        <StatCard icon={Sparkles} value={stats.uniqueTracks} label="Tracks played" />
        <StatCard icon={Heart} value={liked.data?.songs?.length ?? 0} label="Liked songs" />
        <StatCard icon={ListMusic} value={playlists.data?.playlists?.length ?? 0} label="Playlists" />
      </section>

      {stats.topArtists.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight">Your top artists</h2>
          <div className="glass-card flex flex-col gap-3 rounded-2xl p-4">
            {stats.topArtists.map(([artist, plays], index) => (
              <div key={artist} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-xs font-bold text-white",
                    gradientFor(artist)
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{artist}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-glass-faint">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${topCount ? Math.max(6, (plays / topCount) * 100) : 0}%` }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-foreground-500">
                  {pluralize(plays, "play")}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight">App</h2>
        <div className="glass-card flex flex-col divide-y divide-[var(--color-hairline-soft)] rounded-2xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-foreground-500">Dark by default, light if you prefer</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Install</p>
              <p className="text-xs text-foreground-500">Full-screen app with home-screen icon</p>
            </div>
            <InstallPrompt variant="inline" className="shrink-0 justify-end text-right" />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Listening history</p>
              <p className="text-xs text-foreground-500">
                Clearing it also resets your recommendations
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={clearHistory.isPending || stats.uniqueTracks === 0}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-glass-faint px-4 py-2 text-xs font-semibold transition hover:bg-glass-hover disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              Clear
            </button>
          </div>
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-danger/15 px-5 text-sm font-semibold text-danger transition hover:bg-danger/25"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </section>

      <p className="pb-4 text-xs text-foreground-500">
        Streamify is an educational project. Music streams from a public third-party API and is never
        stored or redistributed.
      </p>
    </div>
  );
}
