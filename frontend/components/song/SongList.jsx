"use client";

import { cn } from "@heroui/react";
import { Headphones, Play, Shuffle } from "lucide-react";

import { PlayingBars } from "@/components/common/States";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/format";
import SongMenu from "./SongMenu";

export function SongRow({
  song,
  songs,
  index,
  showIndex = false,
  showDuration = true,
  onRemove,
  removeLabel,
  right,
}) {
  const { play, isCurrent, isPlaying } = usePlayer();
  const active = isCurrent(song.id);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-2 py-2 transition sm:gap-4 sm:px-3",
        active ? "bg-glass-hover" : "hover:bg-glass-hover"
      )}
    >
      {showIndex ? (
        <span className="hidden w-5 shrink-0 justify-center text-center text-xs tabular-nums text-foreground-500 sm:flex">
          {active ? <PlayingBars paused={!isPlaying} /> : (index ?? 0) + 1}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => play(song, songs)}
        aria-label={`Play ${song.title}`}
        className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-glass-faint"
      >
        <img src={song.cover} alt="" loading="lazy" className="size-full object-cover" />
        <span
          className={cn(
            "absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[1px] transition",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Play className="size-4 text-white" fill="currentColor" />
        </span>
      </button>

      <button
        type="button"
        onClick={() => play(song, songs)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            "block truncate text-sm font-medium",
            active ? "text-primary" : "text-foreground"
          )}
          title={song.title}
        >
          {song.title}
        </span>
        <span className="block truncate text-xs text-foreground-500" title={song.artist}>
          {song.artist}
        </span>
      </button>

      {right}

      {showDuration && song.duration ? (
        <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-foreground-500 sm:block">
          {formatTime(song.duration)}
        </span>
      ) : null}

      <SongMenu song={song} onRemove={onRemove} removeLabel={removeLabel} />
    </div>
  );
}

export default function SongList({
  songs = [],
  showIndex = false,
  showHeader = false,
  onRemove,
  removeLabel,
  emptyLabel = "Nothing here yet.",
  right,
}) {
  const { play } = usePlayer();

  const shufflePlay = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    play(shuffled[0], shuffled);
  };

  if (songs.length === 0) {
    return <p className="px-3 py-8 text-center text-sm text-foreground-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {showHeader ? (
        <div className="flex items-center gap-2 px-3 pb-2">
          <button
            type="button"
            onClick={() => play(songs[0], songs)}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
          >
            <Play className="size-3.5" fill="currentColor" />
            Play all
          </button>
          <button
            type="button"
            onClick={shufflePlay}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
          >
            <Shuffle className="size-3.5" />
            Shuffle
          </button>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-foreground-500 sm:flex">
            <Headphones className="size-3.5" />
            {songs.length} {songs.length === 1 ? "track" : "tracks"}
          </span>
        </div>
      ) : null}

      {songs.map((song, index) => (
        <SongRow
          key={`${song.id}-${index}`}
          song={song}
          songs={songs}
          index={index}
          showIndex={showIndex}
          onRemove={onRemove}
          removeLabel={removeLabel}
          right={right ? right(song, index) : undefined}
        />
      ))}
    </div>
  );
}
