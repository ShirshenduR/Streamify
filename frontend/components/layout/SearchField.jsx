"use client";

import { cn } from "@heroui/react";
import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { usePlayer } from "@/hooks/usePlayer";
import { useDebouncedValue, useOnClickOutside } from "@/hooks/useUi";
import { useSearch } from "@/lib/queries";
import { pushRecentSearch } from "@/lib/storage";

/**
 * Search with type-ahead suggestions.
 *
 * Enter navigates to the full results page; picking a suggestion starts playback
 * straight away, which is what people expect from a music app.
 */
export default function SearchField({ className, autoFocus = false, onNavigate }) {
  const router = useRouter();
  const { play } = usePlayer();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const debounced = useDebouncedValue(value, 280);
  const { data, isFetching } = useSearch(debounced, { limit: 8 });
  const results = useMemo(() => data?.results ?? [], [data]);
  const showPanel = open && value.trim().length >= 2;

  useOnClickOutside(containerRef, () => setOpen(false), open);

  const goToResults = useCallback(
    (term) => {
      const query = (term ?? "").trim();
      if (query.length < 2) return;
      pushRecentSearch(query);
      setOpen(false);
      inputRef.current?.blur();
      onNavigate?.();
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router, onNavigate]
  );

  const playSuggestion = useCallback(
    (song) => {
      pushRecentSearch(value);
      play(song, results);
      setOpen(false);
      inputRef.current?.blur();
      onNavigate?.();
    },
    [play, results, value, onNavigate]
  );

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) playSuggestion(results[activeIndex]);
      else goToResults(value);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="glass-float flex h-11 items-center gap-2.5 rounded-full border border-[var(--color-hairline)] px-4 transition focus-within:border-primary/60">
        <Search className="size-4 shrink-0 text-foreground-500" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          type="search"
          autoFocus={autoFocus}
          aria-label="Search songs, artists and albums"
          placeholder="Search songs, artists, albums"
          className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-foreground-500"
        />
        {isFetching && value.trim().length >= 2 ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-foreground-500" />
        ) : value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="grid size-5 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="glass-float animate-rise absolute inset-x-0 top-[3.25rem] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--color-hairline)] p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-foreground-500">
              {isFetching ? "Searching…" : `No results for “${value.trim()}”`}
            </p>
          ) : (
            results.map((song, index) => (
              <button
                key={song.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => playSuggestion(song)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition",
                  activeIndex === index ? "bg-glass-hover" : "hover:bg-glass-hover"
                )}
              >
                <img
                  src={song.cover}
                  alt=""
                  loading="lazy"
                  className="size-9 shrink-0 rounded-lg bg-glass-faint object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{song.title}</span>
                  <span className="block truncate text-xs text-foreground-500">{song.artist}</span>
                </span>
              </button>
            ))
          )}

          <button
            type="button"
            onClick={() => goToResults(value)}
            className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-[var(--color-hairline-soft)] px-3 py-2.5 text-left text-sm font-medium text-primary transition hover:bg-glass-hover"
          >
            <Search className="size-3.5" />
            See all results for “{value.trim()}”
          </button>
        </div>
      ) : null}
    </div>
  );
}
