"use client";

import { cn, Tooltip } from "@heroui/react";
import {
  Heart,
  ListMusic,
  Loader2,
  Maximize2,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback } from "react";

import { useLikeState } from "@/hooks/useLike";
import { usePlayer } from "@/hooks/usePlayer";

import { ProgressLine, SeekBar, VolumeControl } from "./controls";

function ControlButton({ label, onClick, active, disabled, children, className, size = "md" }) {
  return (
    <Tooltip content={label} placement="top" delay={600} classNames={{ content: "glass text-xs" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active === undefined ? undefined : active}
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full transition disabled:opacity-40 disabled:hover:bg-transparent",
          size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10",
          active ? "text-primary" : "text-foreground-500 hover:bg-white/10 hover:text-foreground",
          className
        )}
      >
        {children}
        {active && size === "sm" ? (
          <span className="absolute -bottom-0.5 size-1 rounded-full bg-primary" />
        ) : null}
      </button>
    </Tooltip>
  );
}

export default function PlayerBar({ onExpand, onOpenQueue, className }) {
  const {
    currentSong,
    isPlaying,
    isLoading,
    toggle,
    next,
    previous,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();
  const { isLiked, toggle: toggleLike } = useLikeState();

  const liked = currentSong ? isLiked(currentSong.id) : false;
  const handleLike = useCallback(() => {
    if (currentSong) toggleLike(currentSong);
  }, [currentSong, toggleLike]);

  const hasSong = Boolean(currentSong);

  return (
    // Spacing belongs to the dock, which stacks the player and the nav.
    <div className={cn(!hasSong && "hidden lg:block", className)}>
      <div className="glass-float relative overflow-hidden rounded-[26px] border border-[var(--color-hairline)]">
        {/* Mobile: a slim progress line sits flush with the top of the pill. */}
        {hasSong ? (
          <ProgressLine className="absolute inset-x-0 top-0 rounded-none lg:hidden" />
        ) : null}

        <div className="flex items-center gap-3 p-2.5 lg:gap-5 lg:p-3">
          {/* Track */}
          <button
            type="button"
            onClick={hasSong ? onExpand : undefined}
            disabled={!hasSong}
            className="flex min-w-0 flex-1 items-center gap-3 text-left lg:max-w-[26%]"
          >
            {hasSong ? (
              <img
                src={currentSong.cover}
                alt=""
                className="size-11 shrink-0 rounded-xl bg-glass-faint object-cover shadow-md lg:size-12"
              />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-glass-faint lg:size-12">
                <Music2 className="size-4 text-foreground-500" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold tracking-tight">
                {currentSong?.title ?? "Nothing playing"}
              </span>
              <span className="block truncate text-xs text-foreground-500">
                {currentSong?.artist ?? "Pick a song to start listening"}
              </span>
            </span>
          </button>

          {/* Transport */}
          <div className="flex items-center gap-0.5 lg:flex-1 lg:flex-col lg:gap-1.5">
            <div className="flex items-center gap-0.5">
              <ControlButton
                label="Shuffle"
                onClick={toggleShuffle}
                active={shuffle}
                disabled={!hasSong}
                size="sm"
                className="hidden sm:grid"
              >
                <Shuffle className="size-3.5" />
              </ControlButton>

              <ControlButton label="Previous" onClick={previous} disabled={!hasSong} size="sm">
                <SkipBack className="size-4" fill="currentColor" />
              </ControlButton>

              <ControlButton
                label={isPlaying ? "Pause" : "Play"}
                onClick={toggle}
                disabled={!hasSong}
                size="lg"
              >
                <span className="grid size-10 place-items-center rounded-full bg-foreground text-background shadow-lg transition hover:scale-105 active:scale-95">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="size-4" fill="currentColor" />
                  ) : (
                    <Play className="size-4 translate-x-[1px]" fill="currentColor" />
                  )}
                </span>
              </ControlButton>

              <ControlButton label="Next" onClick={next} disabled={!hasSong} size="sm">
                <SkipForward className="size-4" fill="currentColor" />
              </ControlButton>

              <ControlButton
                label={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat queue" : "Repeat off"}
                onClick={cycleRepeat}
                active={repeat !== "off"}
                disabled={!hasSong}
                size="sm"
                className="hidden sm:grid"
              >
                {repeat === "one" ? <Repeat1 className="size-3.5" /> : <Repeat className="size-3.5" />}
              </ControlButton>
            </div>

            {/* Desktop scrubber under the transport, like the macOS player. */}
            <SeekBar className="hidden w-full max-w-md lg:block" showTimes={false} />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-0.5 lg:flex-1 lg:justify-end">
            <ControlButton
              label={liked ? "Remove from liked" : "Add to liked"}
              onClick={handleLike}
              disabled={!hasSong}
              className="hidden sm:grid"
            >
              <Heart className="size-4" {...(liked ? { fill: "currentColor", strokeWidth: 0 } : {})} />
            </ControlButton>

            <VolumeControl className="hidden lg:flex" />

            <ControlButton
              label="Queue"
              onClick={onOpenQueue}
              disabled={!hasSong}
              className="hidden lg:grid"
            >
              <ListMusic className="size-4" />
            </ControlButton>

            <ControlButton
              label="Open player"
              onClick={onExpand}
              disabled={!hasSong}
              className="hidden lg:grid"
            >
              <Maximize2 className="size-4" />
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}
