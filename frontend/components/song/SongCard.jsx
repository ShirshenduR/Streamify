"use client";

import { cn } from "@heroui/react";
import { Pause, Play } from "lucide-react";

import { PlayingBars } from "@/components/common/States";
import { usePlayer } from "@/hooks/usePlayer";
import SongMenu from "./SongMenu";

/** Album-art tile used by every grid in the app. */
export default function SongCard({ song, songs, subtitle }) {
  const { play, isCurrent, isPlaying } = usePlayer();
  const active = isCurrent(song.id);

  return (
    <div className="group flex flex-col gap-3">
      <button
        type="button"
        onClick={() => play(song, songs)}
        aria-label={`Play ${song.title}`}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-glass-faint shadow-lg shadow-black/20 transition duration-300",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30",
          active && "ring-1 ring-primary/60"
        )}
      >
        <img
          src={song.cover}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        <span
          className={cn(
            "absolute inset-0 grid place-items-center bg-black/40 opacity-0 backdrop-blur-[2px] transition duration-200",
            "group-hover:opacity-100 focus-visible:opacity-100",
            active && !isPlaying && "opacity-0"
          )}
        >
          <span className="grid size-11 place-items-center rounded-full bg-white/90 text-black shadow-xl">
            {active && isPlaying ? (
              <Pause className="size-5" fill="currentColor" />
            ) : (
              <Play className="size-5 translate-x-[1px]" fill="currentColor" />
            )}
          </span>
        </span>

        {active ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 backdrop-blur-md">
            <PlayingBars paused={!isPlaying} />
          </span>
        ) : null}
      </button>

      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold tracking-tight",
              active && "text-primary"
            )}
            title={song.title}
          >
            {song.title}
          </p>
          <p className="truncate text-xs text-foreground-500" title={subtitle ?? song.artist}>
            {subtitle ?? song.artist}
          </p>
        </div>
        <SongMenu
          song={song}
          size="sm"
          triggerClassName="-mt-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"
        />
      </div>
    </div>
  );
}
