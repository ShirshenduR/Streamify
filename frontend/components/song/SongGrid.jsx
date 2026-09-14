"use client";

import { cn } from "@heroui/react";
import { ListMusic, Sparkles } from "lucide-react";
import Link from "next/link";

import { gradientFor } from "@/lib/site";
import SongCard from "./SongCard";

export default function SongGrid({ songs = [], subtitleFor, className }) {
  if (songs.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className
      )}
    >
      {songs.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          songs={songs}
          subtitle={subtitleFor ? subtitleFor(song) : undefined}
        />
      ))}
    </div>
  );
}

/** Tile for a playlist, the liked-songs bucket, or any other collection. */
export function PlaylistCard({ playlist, href, covers = [], icon: Icon = ListMusic, onPress }) {
  const artwork = covers.filter(Boolean).slice(0, 4);
  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-glass-faint shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
        {artwork.length >= 4 ? (
          <div className="grid size-full grid-cols-2 grid-rows-2">
            {artwork.map((cover, index) => (
              <img key={index} src={cover} alt="" loading="lazy" className="size-full object-cover" />
            ))}
          </div>
        ) : artwork.length > 0 ? (
          <img src={artwork[0]} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span
            className={cn(
              "grid size-full place-items-center bg-gradient-to-br text-white/95",
              gradientFor(playlist.name)
            )}
          >
            <Icon className="size-8" />
          </span>
        )}

        <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight" title={playlist.name}>
          {playlist.name}
        </p>
        <p className="truncate text-xs text-foreground-500">
          {playlist.songCount === undefined
            ? "Playlist"
            : `${playlist.songCount} ${playlist.songCount === 1 ? "song" : "songs"}`}
        </p>
      </div>
    </>
  );

  const className = "group block text-left";

  if (href) {
    // Link, not <a>: a plain anchor does a full document load, which reboots the
    // app and flashes the "Starting Streamify" gate on every navigation.
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onPress} className={className}>
      {content}
    </button>
  );
}

export function LikedSongsCard({ count, href }) {
  return (
    <Link href={href} className="group block text-left">
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 transition duration-300 group-hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="size-10 text-white" fill="currentColor" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-9.3-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.3 12c-1.8 4.4-9.3 9-9.3 9Z" />
        </svg>
      </span>
      <span className="mt-3 block min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">Liked songs</span>
        <span className="block truncate text-xs text-foreground-500">
          {count} {count === 1 ? "song" : "songs"}
        </span>
      </span>
    </Link>
  );
}

export function ForYouCard({ artistCount, href }) {
  return (
    <Link href={href} className="group block text-left">
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition duration-300 group-hover:-translate-y-0.5">
        <Sparkles className="size-10 text-white" />
      </span>
      <span className="mt-3 block min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">Made for you</span>
        <span className="block truncate text-xs text-foreground-500">
          {artistCount > 0 ? `Based on ${artistCount} artists` : "Your daily mix"}
        </span>
      </span>
    </Link>
  );
}
