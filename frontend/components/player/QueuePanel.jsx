"use client";

import {
  Button,
  cn,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { ListMusic, Loader2, Play, Trash2 } from "lucide-react";

import { PlayingBars } from "@/components/common/States";
import { usePlayer } from "@/hooks/usePlayer";
import { useIsMobile } from "@/hooks/useUi";
import { formatTime } from "@/lib/format";

function QueueRow({ song, active, playing, onSelect, onRemove }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-2 py-2 transition",
        active ? "bg-glass-hover" : "hover:bg-glass-hover"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-glass-faint">
          <img src={song.cover} alt="" loading="lazy" className="size-full object-cover" />
          {active ? (
            <span className="absolute inset-0 grid place-items-center bg-black/45">
              <PlayingBars paused={!playing} />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn("block truncate text-sm font-medium", active && "text-primary")}
            title={song.title}
          >
            {song.title}
          </span>
          <span className="block truncate text-xs text-foreground-500">{song.artist}</span>
        </span>
      </button>

      {song.duration ? (
        <span className="hidden shrink-0 text-xs tabular-nums text-foreground-500 sm:block">
          {formatTime(song.duration)}
        </span>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${song.title} from queue`}
          className="grid size-9 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export default function QueuePanel({ open, onClose }) {
  const {
    queue,
    index,
    isPlaying,
    jumpTo,
    removeFromQueue,
    clearQueue,
    isLoadingRadio,
    currentSong,
  } = usePlayer();
  const isMobile = useIsMobile();

  const upNext = queue.slice(Math.max(index + 1, 0));
  const earlier = index > 0 ? queue.slice(0, index) : [];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      // A bottom sheet is the natural mobile shape; a centred dialog on desktop.
      placement={isMobile ? "bottom" : "center"}
      size={isMobile ? "full" : "2xl"}
      scrollBehavior="inside"
      classNames={{
        base: cn("glass", isMobile && "m-0 max-h-[85dvh] rounded-b-none rounded-t-3xl"),
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <ListMusic className="size-5 text-primary" />
          Queue
        </ModalHeader>

        <ModalBody className="gap-4">
          {queue.length === 0 ? (
            <p className="py-10 text-center text-sm text-foreground-500">
              Nothing queued. Play a song and it will show up here.
            </p>
          ) : (
            <>
              {currentSong ? (
                <section>
                  <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-500">
                    Now playing
                  </h3>
                  <QueueRow song={currentSong} active playing={isPlaying} />
                </section>
              ) : null}

              <section>
                <h3 className="mb-1 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-500">
                  Next up
                  {isLoadingRadio ? <Loader2 className="size-3 animate-spin" /> : null}
                </h3>
                {upNext.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-foreground-500">
                    The end of the queue — Streamify will keep playing a radio of similar tracks.
                  </p>
                ) : (
                  upNext.map((song, position) => (
                    <QueueRow
                      key={`${song.id}-${position}`}
                      song={song}
                      onSelect={() => jumpTo(index + 1 + position)}
                      onRemove={() => removeFromQueue(index + 1 + position)}
                    />
                  ))
                )}
              </section>

              {earlier.length > 0 ? (
                <section>
                  <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-500">
                    Earlier in this queue
                  </h3>
                  {earlier.map((song, position) => (
                    <QueueRow
                      key={`${song.id}-${position}`}
                      song={song}
                      onSelect={() => jumpTo(position)}
                    />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </ModalBody>

        <ModalFooter className="justify-between">
          <Button
            variant="light"
            startContent={<Play className="size-4" />}
            onPress={onClose}
            className="text-foreground-500"
          >
            Back to player
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 className="size-4" />}
            isDisabled={queue.length === 0}
            onPress={clearQueue}
          >
            Clear queue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
