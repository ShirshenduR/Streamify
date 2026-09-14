"use client";

import { cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import {
  Download,
  Heart,
  ListMusic,
  ListPlus,
  MoreVertical,
  Play,
  Radio,
  Share2,
} from "lucide-react";
import { useCallback, useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { useLikeState } from "@/hooks/useLike";
import { usePlayer } from "@/hooks/usePlayer";
import { downloadUrl } from "@/lib/api";

import { AddToPlaylistDialog } from "../playlist/PlaylistDialogs";

function triggerDownload(song) {
  const anchor = document.createElement("a");
  anchor.href = downloadUrl(song.id);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Per-track actions, shared by every list and card in the app. */
export default function SongMenu({
  song,
  triggerClassName,
  size = "md",
  placement = "bottom-end",
  onRemove,
  removeLabel = "Remove from this playlist",
}) {
  const { play, playNext, addToQueue, startRadioFrom } = usePlayer();
  const { isLiked, toggle } = useLikeState();
  const toast = useToast();
  const [addingTo, setAddingTo] = useState(false);

  const liked = song ? isLiked(song.id) : false;

  const share = useCallback(async () => {
    if (!song) return;
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const url = `${window.location.origin}/search?q=${query}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: song.title, text: `${song.title} — ${song.artist}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      /* the user dismissed the share sheet */
    }
  }, [song, toast]);

  if (!song) return null;

  const iconClass = size === "sm" ? "size-3.5" : "size-4";

  return (
    <>
      <Dropdown placement={placement} classNames={{ content: "glass" }} showArrow={false}>
        <DropdownTrigger>
          <button
            type="button"
            aria-label={`More options for ${song.title}`}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "grid shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground",
              size === "sm" ? "size-7" : "size-9",
              triggerClassName
            )}
          >
            <MoreVertical className={size === "sm" ? "size-3.5" : "size-4"} />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Track actions"
          variant="flat"
          className="max-w-[240px]"
          onAction={(key) => {
            if (key === "play") play(song);
            if (key === "next") {
              playNext(song);
              toast.info("Playing next", { title: song.title });
            }
            if (key === "queue") {
              addToQueue(song);
              toast.success("Added to queue", { title: song.title });
            }
            if (key === "radio") startRadioFrom(song);
            if (key === "playlist") setAddingTo(true);
            if (key === "like") toggle(song);
            if (key === "download") triggerDownload(song);
            if (key === "share") share();
            if (key === "remove" && onRemove) onRemove(song);
          }}
        >
          <DropdownItem key="play" startContent={<Play className={iconClass} />}>
            Play
          </DropdownItem>
          <DropdownItem key="next" startContent={<ListPlus className={iconClass} />}>
            Play next
          </DropdownItem>
          <DropdownItem key="queue" startContent={<ListMusic className={iconClass} />}>
            Add to queue
          </DropdownItem>
          <DropdownItem key="radio" startContent={<Radio className={iconClass} />}>
            Start radio
          </DropdownItem>
          <DropdownItem key="playlist" startContent={<ListPlus className={iconClass} />}>
            Add to playlist…
          </DropdownItem>
          <DropdownItem
            key="like"
            startContent={
              <Heart className={iconClass} {...(liked ? { fill: "currentColor", strokeWidth: 0 } : {})} />
            }
          >
            {liked ? "Remove from liked" : "Add to liked"}
          </DropdownItem>
          <DropdownItem key="download" startContent={<Download className={iconClass} />}>
            Download
          </DropdownItem>
          <DropdownItem key="share" startContent={<Share2 className={iconClass} />}>
            Share
          </DropdownItem>
          {onRemove ? (
            <DropdownItem key="remove" className="text-danger" color="danger" showDivider>
              {removeLabel}
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>

      <AddToPlaylistDialog song={addingTo ? song : null} onClose={() => setAddingTo(false)} />
    </>
  );
}
