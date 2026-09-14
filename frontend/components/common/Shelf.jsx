"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";

import SongCard from "@/components/song/SongCard";
import { SectionHeader } from "./States";

/**
 * A horizontal, snapping shelf.
 *
 * Horizontally scrolling rows are the natural shape for music on a phone, and the
 * arrows only appear once there is room for them on a large screen.
 */
export default function Shelf({ title, subtitle, songs = [], href, hrefLabel = "See all" }) {
  const scrollerRef = useRef(null);

  const nudge = useCallback((direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  if (songs.length === 0) return null;

  const action = (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Scroll left"
        className="hidden size-8 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground lg:grid"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Scroll right"
        className="hidden size-8 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground lg:grid"
      >
        <ChevronRight className="size-4" />
      </button>
      {href ? (
        <Link
          href={href}
          className="ml-1 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {songs.map((song) => (
          <div
            key={song.id}
            className="w-[43%] shrink-0 snap-start sm:w-40 lg:w-44 xl:w-48"
          >
            <SongCard song={song} songs={songs} />
          </div>
        ))}
      </div>
    </section>
  );
}
