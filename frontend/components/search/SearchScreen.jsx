"use client";

import { Clock, Loader2, Search, Sparkles, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  EmptyState,
  ErrorState,
  SectionHeader,
  ServiceUnavailable,
  SongListSkeleton,
} from "@/components/common/States";
import SongList from "@/components/song/SongList";
import { usePlayer } from "@/hooks/usePlayer";
import { useDebouncedValue, useMounted } from "@/hooks/useUi";
import { useDiscover, useSearch } from "@/lib/queries";
import { gradientFor } from "@/lib/site";
import { pushRecentSearch, readStore, STORE_KEYS, writeStore } from "@/lib/storage";

export default function SearchScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { play } = usePlayer();
  const mounted = useMounted();

  const urlQuery = searchParams.get("q") ?? "";
  const [term, setTerm] = useState(urlQuery);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setTerm(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (mounted) setRecent(readStore(STORE_KEYS.recentSearches, []));
  }, [mounted]);

  const debounced = useDebouncedValue(term, 320);
  const query = debounced.trim();
  const active = query.length >= 2;

  // Bumped by "Try again" so the request carries refresh=1 and the server clears
  // its upstream cooldown instead of waiting it out.
  const [refresh, setRefresh] = useState(0);

  const { data, isLoading, isFetching, isError, error, refetch } = useSearch(query, {
    limit: 30,
    refresh,
  });
  const discover = useDiscover(6);
  const results = data?.results ?? [];
  const moods = discover.data?.moods ?? [];
  const unavailable = Boolean(data?.unavailable);

  // Keep the address bar shareable without spraying history entries.
  useEffect(() => {
    if (!mounted || query.length < 2 || query === urlQuery) return;
    pushRecentSearch(query);
    setRecent(readStore(STORE_KEYS.recentSearches, []));
    router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
  }, [query, urlQuery, router, mounted]);

  const clearRecent = () => {
    writeStore(STORE_KEYS.recentSearches, []);
    setRecent([]);
  };

  return (
    <div className="flex flex-col gap-6 pt-5 sm:pt-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
      </header>

      <div className="flex h-12 items-center gap-3 rounded-2xl bg-glass-faint px-4 transition focus-within:bg-glass-hover">
        <Search className="size-4 shrink-0 text-foreground-500" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Search songs, artists and albums"
          placeholder="Songs, artists, albums"
          className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-foreground-500"
        />
        {isFetching && active ? <Loader2 className="size-4 shrink-0 animate-spin text-foreground-500" /> : null}
        {term ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => setTerm("")}
            className="grid size-6 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {!active ? (
        <>
          {recent.length > 0 ? (
            <section>
              <SectionHeader
                title="Recent searches"
                action={
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
                  >
                    Clear
                  </button>
                }
              />
              <div className="flex flex-wrap gap-2">
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTerm(item)}
                    className="inline-flex items-center gap-2 rounded-full bg-glass-faint px-4 py-2.5 text-sm font-medium transition hover:bg-glass-hover"
                  >
                    <Clock className="size-3.5 text-foreground-500" />
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {moods.length > 0 ? (
            <section>
              <SectionHeader title="Browse by mood" subtitle="Tap a mood to hear something new" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setTerm(mood.query)}
                    className={`relative aspect-[5/3] overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left shadow-lg transition hover:scale-[1.02] active:scale-[0.98] ${gradientFor(
                      mood.label
                    )}`}
                  >
                    <span className="text-sm font-bold text-white drop-shadow">{mood.label}</span>
                    <span className="absolute -bottom-3 -right-2 size-16 rotate-[25deg] rounded-xl bg-white/15" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {recent.length === 0 && moods.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Search for anything"
              description="Find songs, artists and albums from millions of tracks."
            />
          ) : null}
        </>
      ) : isLoading ? (
        <SongListSkeleton rows={10} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : unavailable && results.length === 0 ? (
        <ServiceUnavailable onRetry={() => setRefresh((count) => count + 1)} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={`No results for “${query}”`}
          description="Check the spelling, or try a different artist or song name."
        />
      ) : (
        <section>
          <SectionHeader
            title="Songs"
            subtitle={`${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`}
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
          <SongList songs={results} showIndex />
        </section>
      )}

      {!active ? (
        <p className="text-center text-xs text-foreground-500">
          Tip: press <kbd className="rounded bg-glass-faint px-1.5 py-0.5">Space</kbd> to play or
          pause anywhere in the app.{" "}
          <Link href="/home" className="underline decoration-dotted">
            Back home
          </Link>
        </p>
      ) : null}
    </div>
  );
}
