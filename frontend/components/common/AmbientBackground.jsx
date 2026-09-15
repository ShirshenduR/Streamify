"use client";

import { WifiOff } from "lucide-react";

import { usePlayerOptional } from "@/hooks/usePlayer";

/**
 * The ambient wash behind everything, the way Apple Music tints a screen with the
 * artwork that is playing.
 *
 * The colour is produced by heavily blurring the cover itself rather than
 * sampling pixels — canvas colour extraction would fail on the CDN's
 * cross-origin images, and a blurred cover gives the same average-colour effect.
 */
export default function AmbientBackground({ variant = "soft", cover: overrideCover }) {
  const player = usePlayerOptional();
  const cover = overrideCover !== undefined ? overrideCover : player?.currentSong?.cover;
  const strong = variant === "strong";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      {cover ? (
        <img
          key={cover}
          src={cover}
          alt=""
          className={`animate-fade-in absolute inset-0 size-full scale-150 object-cover blur-[90px] ${
            strong ? "opacity-55" : "opacity-40"
          }`}
        />
      ) : null}

      <div className="animate-drift absolute -top-1/3 left-1/2 h-[70vh] w-[90vw] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
      <div className="absolute -bottom-1/3 -right-1/4 h-[60vh] w-[70vw] rounded-full bg-fuchsia-500/15 blur-[150px]" />

      {/* The wash must stay translucent along the bottom. Ending on opaque
          `background` left the floating glass with nothing but near-black behind
          it, so it stopped reading as glass at all. The middle stays dense
          because that is where text sits. */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${
          strong
            ? "from-background/55 via-background/70 to-background"
            : "from-background/60 via-background/72 to-background/45"
        }`}
      />
    </div>
  );
}

export function OfflineNotice() {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
      <WifiOff className="size-4 shrink-0 text-amber-400" />
      <p className="text-foreground-600">
        You are offline. Playback needs a connection, but everything you have visited still works.
      </p>
    </div>
  );
}
