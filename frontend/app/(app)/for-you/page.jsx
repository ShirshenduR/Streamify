"use client";

import { Radio, RefreshCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  EmptyState,
  ErrorState,
  SectionHeader,
  ServiceUnavailable,
  SongGridSkeleton,
} from "@/components/common/States";
import SongGrid from "@/components/song/SongGrid";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/hooks/usePlayer";
import { useRecommendations } from "@/lib/queries";

export default function ForYouPage() {
  const { uid } = useAuth();
  const { play, startRadioFrom } = usePlayer();
  const [refresh, setRefresh] = useState(0);
  const { data, isLoading, isFetching, isError, error, refetch } = useRecommendations(
    uid,
    30,
    refresh
  );

  const results = data?.results ?? [];
  const basedOn = data?.basedOn ?? [];

  return (
    <div className="flex flex-col gap-6 pt-5 sm:pt-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">For you</h1>
          <p className="mt-1 text-sm text-foreground-500">
            {data?.personalized
              ? "Built from your plays and likes."
              : "A starting mix — it becomes personal as you listen."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {results.length > 0 ? (
            <button
              type="button"
              onClick={() => startRadioFrom(results[0])}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-lg transition hover:brightness-95 active:scale-95"
            >
              <Radio className="size-4" />
              Start radio
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex size-10 items-center justify-center rounded-full bg-glass-faint text-foreground-500 transition hover:bg-glass-hover hover:text-foreground disabled:opacity-50"
            aria-label="Refresh recommendations"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {basedOn.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-500">
            Based on
          </span>
          {basedOn.map((artist) => (
            <Link
              key={artist}
              href={`/search?q=${encodeURIComponent(artist)}`}
              className="rounded-full bg-glass-faint px-3 py-1.5 text-xs font-medium transition hover:bg-glass-hover"
            >
              {artist}
            </Link>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <SongGridSkeleton count={12} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : results.length === 0 && data?.unavailable ? (
        <ServiceUnavailable onRetry={() => setRefresh((count) => count + 1)} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Listen to or like a few songs, then come back — Streamify learns the artists you enjoy."
          action={
            <Link
              href="/search"
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
            >
              <Search className="size-4" />
              Find music
            </Link>
          }
        />
      ) : (
        <section>
          <SectionHeader
            title="Recommended for you"
            subtitle={
              data?.personalized ? undefined : "Play something and this list starts adapting"
            }
            action={
              <button
                type="button"
                onClick={() => play(results[0], results)}
                className="rounded-full bg-glass-faint px-4 py-2 text-xs font-semibold transition hover:bg-glass-hover"
              >
                Play all
              </button>
            }
          />
          <SongGrid songs={results} subtitleFor={(song) => song.reason || song.artist} />
        </section>
      )}
    </div>
  );
}
