"use client";

import { Clock, Play, Sparkles } from "lucide-react";
import Link from "next/link";

import InstallPrompt from "@/components/common/InstallPrompt";
import Shelf from "@/components/common/Shelf";
import {
  EmptyState,
  ErrorState,
  SectionHeader,
  ShelfSkeleton,
  SongGridSkeleton,
} from "@/components/common/States";
import SongGrid from "@/components/song/SongGrid";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/hooks/usePlayer";
import { useMounted } from "@/hooks/useUi";
import { greetingFor } from "@/lib/format";
import { useDiscover, useHistory, useRecommendations } from "@/lib/queries";
import { gradientFor } from "@/lib/site";

function HeroCard({ song, eyebrow, onPlay, href }) {
  if (!song) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl">
      {song.cover ? (
        <img
          src={song.cover}
          alt=""
          className="absolute inset-0 size-full scale-125 object-cover blur-2xl"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/55 to-black/70" />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <img
          src={song.cover}
          alt=""
          className="size-28 shrink-0 rounded-2xl object-cover shadow-2xl shadow-black/50 sm:size-32"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
            {song.title}
          </h2>
          <p className="truncate text-sm text-white/70">{song.artist}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPlay(song)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg transition hover:scale-[1.02] active:scale-95"
            >
              <Play className="size-4" fill="currentColor" />
              Play
            </button>
            {href ? (
              <Link
                href={href}
                className="inline-flex h-10 items-center rounded-full bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
              >
                See all
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { uid, user } = useAuth();
  const { currentSong, play } = usePlayer();
  const mounted = useMounted();

  const discover = useDiscover(12);
  const recommendations = useRecommendations(uid, 18);
  const history = useHistory(uid, 12);

  const recents = history.data?.songs ?? [];
  const recommendationsList = recommendations.data?.results ?? [];
  const sections = discover.data?.sections ?? [];
  const moods = discover.data?.moods ?? [];

  const firstName = (user?.displayName || "").trim().split(/\s+/)[0];
  const heroSong = currentSong || recommendationsList[0] || null;

  return (
    <div className="flex flex-col gap-10 pt-5 sm:pt-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {mounted ? greetingFor() : "Welcome back"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-foreground-500">
          {recommendations.data?.personalized
            ? "Fresh picks shaped by what you have been playing."
            : "Play or like a few songs and this page becomes yours."}
        </p>
      </header>

      <InstallPrompt variant="banner" className="hidden sm:flex" />

      {heroSong ? (
        <HeroCard
          song={heroSong}
          eyebrow={currentSong ? "Continue listening" : "Start here"}
          onPlay={(song) => play(song, recommendationsList)}
          href={currentSong ? undefined : "/for-you"}
        />
      ) : null}

      {recents.length > 0 ? (
        <Shelf
          title="Jump back in"
          subtitle="Recently played"
          songs={recents}
          href="/library?tab=recent"
        />
      ) : null}

      {recommendations.isLoading ? (
        <section>
          <SectionHeader title="Made for you" />
          <SongGridSkeleton count={6} />
        </section>
      ) : recommendationsList.length > 0 ? (
        <Shelf
          title="Made for you"
          subtitle={
            recommendations.data?.basedOn?.length
              ? `Because you listen to ${recommendations.data.basedOn.slice(0, 3).join(", ")}`
              : "Recommendations to get you started"
          }
          songs={recommendationsList}
          href="/for-you"
        />
      ) : null}

      {discover.isLoading ? (
        <ShelfSkeleton shelves={2} cards={6} />
      ) : discover.isError ? (
        <ErrorState
          title="Could not load the catalogue"
          message={discover.error?.message}
          onRetry={() => discover.refetch()}
        />
      ) : (
        sections.map((section) => (
          <Shelf key={section.key} title={section.title} songs={section.songs} />
        ))
      )}

      {moods.length > 0 ? (
        <section>
          <SectionHeader title="Browse by mood" />
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <Link
                key={mood.label}
                href={`/search?q=${encodeURIComponent(mood.query)}`}
                className={`rounded-full bg-gradient-to-br px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03] active:scale-95 ${gradientFor(
                  mood.label
                )}`}
              >
                {mood.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!discover.isLoading && !recommendations.isLoading && sections.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing to show yet"
          description="Search for something you love to get the recommendations going."
          action={
            <Link
              href="/search"
              className="mt-1 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
            >
              Start searching
            </Link>
          }
        />
      ) : null}

      {recents.length > 0 ? (
        <section>
          <SectionHeader
            title="Pick up where you left off"
            action={
              <Link
                href="/library?tab=recent"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
              >
                <Clock className="size-3.5" />
                History
              </Link>
            }
          />
          <SongGrid songs={recents.slice(0, 6)} />
        </section>
      ) : null}
    </div>
  );
}
