"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@heroui/react";

/* ------------------------------------------------------------------ loading -- */

export function PageLoader({ label = "Loading" }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-hairline border-t-primary" />
        <p className="text-sm text-foreground-500">{label}…</p>
      </div>
    </div>
  );
}

export function SongGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-glass-faint" />
          <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-glass-faint" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-glass-faint" />
        </div>
      ))}
    </div>
  );
}

export function SongListSkeleton({ rows = 8 }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl px-3 py-2.5">
          <div className="size-11 shrink-0 animate-pulse rounded-lg bg-glass-faint" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-glass-faint" />
            <div className="h-3 w-1/5 animate-pulse rounded-full bg-glass-faint" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShelfSkeleton({ shelves = 2, cards = 6 }) {
  return (
    <div className="flex flex-col gap-10">
      {Array.from({ length: shelves }).map((_, shelf) => (
        <div key={shelf} className="flex flex-col gap-4">
          <div className="h-5 w-40 animate-pulse rounded-full bg-glass-faint" />
          <SongGridSkeleton count={cards} />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- empty -- */

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center gap-3 rounded-3xl px-8 py-14 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="grid size-14 place-items-center rounded-2xl bg-glass-faint text-foreground-500">
          <Icon className="size-6" />
        </span>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-foreground-500">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry, compact = false }) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center gap-3 rounded-3xl px-6 text-center",
        compact ? "py-8" : "py-14"
      )}
    >
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {message ? <p className="max-w-md text-sm text-foreground-500">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- bits ---- */

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-foreground-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** The little animated bars shown next to whatever is currently playing. */
export function PlayingBars({ paused = false, className }) {
  return (
    <span className={cn("flex h-3.5 items-end gap-[2px]", className)} aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-[2px] origin-bottom rounded-full bg-primary",
            paused ? "h-1.5" : "animate-equalize h-full"
          )}
          style={paused ? undefined : { animationDelay: `${bar * 140}ms` }}
        />
      ))}
    </span>
  );
}
