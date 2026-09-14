"use client";

import { cn, Tab, Tabs } from "@heroui/react";
import { Clock, Heart, ListMusic, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState, SongListSkeleton } from "@/components/common/States";
import { CreatePlaylistDialog } from "@/components/playlist/PlaylistDialogs";
import { ForYouCard, LikedSongsCard, PlaylistCard } from "@/components/song/SongGrid";
import SongList from "@/components/song/SongList";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { useClearHistory, useHistory, useLikedSongs, usePlaylists } from "@/lib/queries";

const TABS = [
  { key: "playlists", label: "Playlists", icon: ListMusic },
  { key: "liked", label: "Liked", icon: Heart },
  { key: "recent", label: "Recent", icon: Clock },
];

export default function LibraryPage() {
  const { uid } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("playlists");
  const [creating, setCreating] = useState(false);

  const playlists = usePlaylists(uid);
  const liked = useLikedSongs(uid);
  const history = useHistory(uid, 50);
  const clearHistory = useClearHistory(uid);

  const playlistList = playlists.data?.playlists ?? [];
  const likedSongs = liked.data?.songs ?? [];
  const recentSongs = history.data?.songs ?? [];

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync();
      toast.success("Listening history cleared");
    } catch (error) {
      toast.error(error?.message || "Could not clear the history.");
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-5 sm:pt-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your library</h1>
          <p className="mt-1 text-sm text-foreground-500">
            {playlistList.length} {playlistList.length === 1 ? "playlist" : "playlists"} ·{" "}
            {likedSongs.length} liked
          </p>
        </div>
        {tab === "playlists" ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-lg transition hover:brightness-95 active:scale-95"
          >
            <Plus className="size-4" />
            New playlist
          </button>
        ) : null}
        {tab === "recent" && recentSongs.length > 0 ? (
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={clearHistory.isPending}
            className="rounded-full bg-glass-faint px-4 py-2 text-xs font-semibold transition hover:bg-glass-hover disabled:opacity-50"
          >
            Clear history
          </button>
        ) : null}
      </header>

      <Tabs
        aria-label="Library sections"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
        variant="light"
        classNames={{
          base: "w-full",
          tabList:
            "w-full gap-1 rounded-2xl bg-glass-faint p-1 sm:w-auto sm:justify-start",
          tab: "h-9 px-4 text-sm font-semibold",
          cursor: "rounded-xl bg-glass-hover",
          panel: "px-0 pt-5",
        }}
      >
        {TABS.map((entry) => (
          <Tab
            key={entry.key}
            title={
              <span className="flex items-center gap-2">
                <entry.icon className="size-4" />
                {entry.label}
              </span>
            }
          />
        ))}
      </Tabs>

      {tab === "playlists" ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <LikedSongsCard count={likedSongs.length} href="/library/liked" />
          <ForYouCard artistCount={0} href="/for-you" />
          {playlistList.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} href={`/library/${playlist.id}`} />
          ))}
          <button type="button" onClick={() => setCreating(true)} className="group text-left">
            <span className="grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-[var(--color-hairline)] bg-glass-faint transition group-hover:bg-glass-hover">
              <Plus className="size-7 text-foreground-500" />
            </span>
            <span className="mt-3 block text-sm font-semibold tracking-tight">New playlist</span>
            <span className="block text-xs text-foreground-500">Start a collection</span>
          </button>
        </div>
      ) : null}

      {tab === "liked" ? (
        liked.isLoading ? (
          <SongListSkeleton rows={8} />
        ) : likedSongs.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No liked songs yet"
            description="Tap the heart on any track and it will be waiting for you here."
            action={
              <Link
                href="/search"
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
              >
                <Sparkles className="size-4" />
                Find music
              </Link>
            }
          />
        ) : (
          <SongList songs={likedSongs} showHeader showIndex />
        )
      ) : null}

      {tab === "recent" ? (
        history.isLoading ? (
          <SongListSkeleton rows={8} />
        ) : recentSongs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nothing played yet"
            description="Everything you listen to shows up here, and it feeds your recommendations."
          />
        ) : (
          <SongList
            songs={recentSongs}
            showHeader
            right={(song) =>
              song.playCount > 1 ? (
                <span className={cn("shrink-0 text-xs tabular-nums text-foreground-500")}>
                  {song.playCount}×
                </span>
              ) : null
            }
          />
        )
      ) : null}

      <CreatePlaylistDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
