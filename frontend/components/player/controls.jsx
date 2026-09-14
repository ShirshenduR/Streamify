"use client";

import { cn, Slider } from "@heroui/react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/format";

const numberFrom = (value) => (Array.isArray(value) ? value[0] : value);

export function SeekBar({ className, showTimes = true }) {
  const { duration, currentTime, seek } = usePlayer();
  const [dragValue, setDragValue] = useState(null);

  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const value = dragValue ?? Math.min(currentTime, max || 0);

  return (
    <div className={cn("group/seek", className)}>
      <Slider
        aria-label="Seek"
        size="sm"
        step={1}
        minValue={0}
        maxValue={max || 1}
        isDisabled={max === 0}
        value={value}
        onChange={(next) => setDragValue(numberFrom(next))}
        onChangeEnd={(next) => {
          seek(numberFrom(next));
          setDragValue(null);
        }}
        classNames={{
          base: "gap-0",
          trackWrapper: "items-center",
          track: cn("h-1 rounded-full", max === 0 ? "bg-glass-faint" : "bg-white/15"),
          filler: "rounded-full bg-foreground/90 transition-colors group-hover/seek:bg-primary",
          thumb:
            "size-3 rounded-full bg-foreground shadow-md transition-opacity opacity-0 group-hover/seek:opacity-100 group-data-[dragging=true]/seek:opacity-100",
        }}
      />
      {showTimes ? (
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-foreground-500">
          <span>{formatTime(dragValue ?? currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Non-interactive progress line for the compact mobile player. */
export function ProgressLine({ className }) {
  const { currentTime, duration } = usePlayer();
  const played = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className={cn("h-[3px] w-full overflow-hidden rounded-full bg-white/15", className)}>
      <div
        className="h-full rounded-full bg-foreground/80 transition-[width] duration-500 ease-linear"
        style={{ width: `${played}%` }}
      />
    </div>
  );
}

export function VolumeControl({ className, showSlider = true }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
        className="grid size-9 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
      >
        <Icon className="size-4" />
      </button>

      {showSlider ? (
        <Slider
          aria-label="Volume"
          size="sm"
          step={0.02}
          minValue={0}
          maxValue={1}
          value={level}
          onChange={(next) => setVolume(numberFrom(next))}
          className="hidden w-24 lg:flex"
          classNames={{
            base: "gap-0",
            track: "h-1 rounded-full bg-white/15",
            filler: "rounded-full bg-foreground/80",
            thumb: "size-2.5 rounded-full bg-foreground opacity-0 transition-opacity hover:opacity-100",
          }}
        />
      ) : null}
    </div>
  );
}
