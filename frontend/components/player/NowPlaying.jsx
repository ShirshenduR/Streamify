"use client";

import { cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from "@heroui/react";
import {
  ChevronDown,
  Download,
  Heart,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Search,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import AmbientBackground from "@/components/common/AmbientBackground";
import { useToast } from "@/components/providers/ToastProvider";
import SongMenu from "@/components/song/SongMenu";
import { useLikeState } from "@/hooks/useLike";
import { usePlayer } from "@/hooks/usePlayer";
import { downloadUrl } from "@/lib/api";
import { formatTime } from "@/lib/format";

import { SeekBar, VolumeControl } from "./controls";

const SWIPE_CLOSE_PX = 110;

function SleepTimerButton() {
  const { sleepEndsAt, setSleepTimer } = usePlayer();
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!sleepEndsAt) {
      setRemaining(null);
      return undefined;
    }
    const update = () => setRemaining(Math.max(0, sleepEndsAt - Date.now()));
    update();
    const interval = setInterval(update, 15_000);
    return () => clearInterval(interval);
  }, [sleepEndsAt]);

  return (
    <Dropdown placement="top end" classNames={{ content: "glass" }} showArrow={false}>
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Sleep timer"
          className={cn(
            "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
            sleepEndsAt
              ? "bg-primary/15 text-primary"
              : "text-foreground-500 hover:bg-white/10 hover:text-foreground"
          )}
        >
          <Timer className="size-4" />
          {remaining ? formatTime(remaining / 1000) : null}
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Sleep timer"
        onAction={(key) => setSleepTimer(key === "off" ? null : Number(key))}
      >
        <DropdownItem key="off">Off</DropdownItem>
        <DropdownItem key="15">In 15 minutes</DropdownItem>
        <DropdownItem key="30">In 30 minutes</DropdownItem>
        <DropdownItem key="60">In 1 hour</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default function NowPlaying({ open, onClose, onOpenQueue }) {
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
    playbackError,
    dismissError,
  } = usePlayer();
  const { isLiked, toggle: toggleLike } = useLikeState();
  const toast = useToast();

  const scrollRef = useRef(null);
  const dragRef = useRef(0);
  const touchRef = useRef({ startY: 0, active: false });
  const [dragY, setDragY] = useState(0);

  // Surface playback failures without blocking the sheet.
  useEffect(() => {
    if (open && playbackError?.message) {
      toast.error(playbackError.message, { title: "Playback problem" });
    }
  }, [open, playbackError, toast]);

  // Escape closes, matching the rest of the overlay behaviour.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onTouchStart = (event) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
    touchRef.current = { startY: event.touches[0].clientY, active: true };
  };

  const onTouchMove = (event) => {
    if (!touchRef.current.active) return;
    const delta = event.touches[0].clientY - touchRef.current.startY;
    const next = delta > 0 ? delta : 0;
    dragRef.current = next;
    setDragY(next);
  };

  const onTouchEnd = () => {
    if (!touchRef.current.active) return;
    touchRef.current.active = false;
    const shouldClose = dragRef.current > SWIPE_CLOSE_PX;
    dragRef.current = 0;
    setDragY(0);
    if (shouldClose) onClose();
  };

  const handleLike = useCallback(() => {
    if (currentSong) toggleLike(currentSong);
  }, [currentSong, toggleLike]);

  const handleShare = useCallback(async () => {
    if (!currentSong) return;
    const url = `${window.location.origin}/search?q=${encodeURIComponent(
      `${currentSong.title} ${currentSong.artist}`
    )}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentSong.title,
          text: `${currentSong.title} — ${currentSong.artist}`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      /* dismissed */
    }
  }, [currentSong, toast]);

  const searchForTrack = () => {
    const term = encodeURIComponent(`${currentSong?.title ?? ""} ${currentSong?.artist ?? ""}`.trim());
    dismissError();
    onClose();
    window.location.href = `/search?q=${term}`;
  };

  if (!open || !currentSong) return null;

  const liked = isLiked(currentSong.id);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Now playing" aria-modal="true">
      <AmbientBackground variant="strong" />

      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? "none" : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="animate-rise flex h-full flex-col overflow-y-auto overscroll-contain px-5 pb-8 pt-3 sm:px-8"
      >
        {/* Grabber + header */}
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-white/25 sm:hidden" />

        <header className="flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="grid size-11 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
          >
            <ChevronDown className="size-5" />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-500">
            {currentSong.album || "Now playing"}
          </p>
          <SongMenu song={currentSong} />
        </header>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-7 py-5">
          {currentSong.cover ? (
            <img
              src={currentSong.cover}
              alt=""
              className={cn(
                "mx-auto aspect-square w-full max-w-[min(78vw,22rem)] rounded-3xl object-cover shadow-2xl shadow-black/50 transition-transform duration-500",
                isPlaying ? "scale-100" : "scale-[0.9]"
              )}
            />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-[min(78vw,22rem)] rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl" />
          )}

          {playbackError ? (
            <div className="glass flex items-start gap-3 rounded-2xl p-4">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{playbackError.message}</p>
                <button
                  type="button"
                  onClick={searchForTrack}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
                >
                  <Search className="size-3" />
                  Look for another version
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {currentSong.title}
              </h1>
              <p className="truncate text-base text-foreground-500 sm:text-lg">
                {currentSong.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLike}
              aria-label={liked ? "Remove from liked" : "Add to liked"}
              aria-pressed={liked}
              className="grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-white/10"
            >
              <Heart
                className={cn("size-6", liked ? "text-primary" : "text-foreground-500")}
                {...(liked ? { fill: "currentColor", strokeWidth: 0 } : {})}
              />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <SeekBar />

            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                aria-label="Shuffle"
                aria-pressed={shuffle}
                className={cn(
                  "grid size-11 place-items-center rounded-full transition",
                  shuffle
                    ? "text-primary"
                    : "text-foreground-500 hover:bg-white/10 hover:text-foreground"
                )}
              >
                <Shuffle className="size-5" />
              </button>

              <button
                type="button"
                onClick={previous}
                aria-label="Previous"
                className="grid size-12 place-items-center rounded-full text-foreground transition hover:bg-white/10"
              >
                <SkipBack className="size-6" fill="currentColor" />
              </button>

              <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="grid size-16 place-items-center rounded-full bg-foreground text-background shadow-xl transition hover:scale-[1.03] active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-6" fill="currentColor" />
                ) : (
                  <Play className="size-6 translate-x-[2px]" fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="grid size-12 place-items-center rounded-full text-foreground transition hover:bg-white/10"
              >
                <SkipForward className="size-6" fill="currentColor" />
              </button>

              <button
                type="button"
                onClick={cycleRepeat}
                aria-label={
                  repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat queue" : "Repeat off"
                }
                aria-pressed={repeat !== "off"}
                className={cn(
                  "grid size-11 place-items-center rounded-full transition",
                  repeat !== "off"
                    ? "text-primary"
                    : "text-foreground-500 hover:bg-white/10 hover:text-foreground"
                )}
              >
                {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </button>
            </div>
          </div>

          {/* Secondary actions — big enough to tap, wrapped for narrow phones. */}
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Tooltip content="Download" placement="top" classNames={{ content: "glass text-xs" }}>
              <button
                type="button"
                aria-label="Download this track"
                onClick={() => {
                  const anchor = document.createElement("a");
                  anchor.href = downloadUrl(currentSong.id);
                  anchor.rel = "noopener";
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                }}
                className="grid size-11 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
              >
                <Download className="size-5" />
              </button>
            </Tooltip>

            <button
              type="button"
              onClick={onOpenQueue}
              aria-label="Open queue"
              className="grid size-11 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
            >
              <ListMusic className="size-5" />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this track"
              className="grid size-11 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
            >
              <Share2 className="size-5" />
            </button>

            <SleepTimerButton />
          </div>

          <VolumeControl className="hidden justify-center lg:flex" />
        </div>
      </div>
    </div>
  );
}
