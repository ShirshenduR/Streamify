"use client";

import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@heroui/react";
import { ArrowDown, ArrowUp, Heart, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, SongListSkeleton } from "@/components/common/States";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DeletePlaylistDialog,
  RenamePlaylistDialog,
} from "@/components/playlist/PlaylistDialogs";
import SongList from "@/components/song/SongList";
import { useAuth } from "@/hooks/useAuth";
import { formatLongDuration, pluralize } from "@/lib/format";
import { useLikedSongs, usePlaylist, useRemoveFromPlaylist, useReorderPlaylist } from "@/lib/queries";
import { gradientFor } from "@/lib/site";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { uid } = useAuth();
  const toast = useToast();

  const id = String(params.id ?? "");
  const isLikedView = id === "liked";

  const playlistQuery = usePlaylist(uid, isLikedView ? null : id);
  const likedQuery = useLikedSongs(uid);
  const removeSong = useRemoveFromPlaylist(uid);
  const reorder = useReorderPlaylist(uid);

  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLoading = isLikedView ? likedQuery.isLoading : playlistQuery.isLoading;
  const error = isLikedView ? likedQuery.error : playlistQuery.error;

  const playlist = isLikedView ? null : playlistQuery.data;
  const songs = isLikedView ? (likedQuery.data?.songs ?? []) : (playlist?.songs ?? []);
  const name = isLikedView ? "Liked songs" : (playlist?.name ?? "");

  const covers = songs.map((song) => song.cover).filter(Boolean).slice(0, 4);
  const duration = songs.reduce((sum, song) => sum + (Number(song.duration) || 0), 0);

  const handleRemove = async (song) => {
    try {
      await removeSong.mutateAsync({ playlistId: id, songId: song.id });
      toast.success(`Removed “${song.title}”`);
    } catch (err) {
      toast.error(err?.message || "Could not remove the song.");
    }
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= songs.length) return;
    const next = [...songs];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate({ playlistId: id, order: next.map((song) => song.id), songs: next });
  };

  const notFound = !isLoading && !isLikedView && !playlist && !error;

  return (
    <div className="flex flex-col gap-7 pt-5 sm:pt-7">
      <Link
        href="/library"
        className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
      >
        ← Library
      </Link>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="h-40 animate-pulse rounded-3xl bg-glass-faint" />
          <SongListSkeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState
          message={error.message}
          onRetry={() => (isLikedView ? likedQuery.refetch() : playlistQuery.refetch())}
        />
      ) : notFound ? (
        <EmptyState
          title="Playlist not found"
          description="It may have been deleted, or it belongs to another account."
          action={
            <Link
              href="/library"
              className="mt-1 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
            >
              Back to library
            </Link>
          }
        />
      ) : (
        <>
          {/* Hero */}
          <section className="glass-card flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
            <div className="size-36 shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/40 sm:size-40">
              {covers.length >= 4 ? (
                <div className="grid size-full grid-cols-2 grid-rows-2">
                  {covers.map((cover, index) => (
                    <img
                      key={index}
                      src={cover}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : covers.length > 0 ? (
                <img src={covers[0]} alt="" className="size-full object-cover" />
              ) : (
                <span
                  className={cn(
                    "grid size-full place-items-center bg-gradient-to-br text-white",
                    gradientFor(name || "streamify")
                  )}
                >
                  {isLikedView ? (
                    <Heart className="size-12" fill="currentColor" />
                  ) : (
                    <span className="text-3xl font-bold">{name.slice(0, 1).toUpperCase()}</span>
                  )}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-500">
                {isLikedView ? "Collection" : "Playlist"}
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-4xl">{name}</h1>
              <p className="mt-2 text-sm text-foreground-500">
                {pluralize(songs.length, "song")}
                {duration > 0 ? ` · ${formatLongDuration(duration)}` : ""}
              </p>
            </div>

            {!isLikedView ? (
              <Dropdown placement="bottom-end" classNames={{ content: "glass" }} showArrow={false}>
                <DropdownTrigger>
                  <button
                    type="button"
                    aria-label="Playlist options"
                    className="grid size-10 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Playlist options"
                  onAction={(key) => {
                    if (key === "rename") setRenaming(true);
                    if (key === "delete") setDeleting(true);
                  }}
                >
                  <DropdownItem key="rename" startContent={<Pencil className="size-4" />}>
                    Rename
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    color="danger"
                    className="text-danger"
                    startContent={<Trash2 className="size-4" />}
                  >
                    Delete playlist
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : null}
          </section>

          {songs.length === 0 ? (
            <EmptyState
              icon={Plus}
              title={isLikedView ? "No liked songs yet" : "This playlist is empty"}
              description={
                isLikedView
                  ? "Tap the heart on a track and it lands here."
                  : "Search for something you love and add it to this playlist."
              }
              action={
                <Link
                  href="/search"
                  className="mt-1 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
                >
                  Find songs
                </Link>
              }
            />
          ) : (
            <SongList
              songs={songs}
              showHeader
              showIndex
              onRemove={isLikedView ? undefined : handleRemove}
              removeLabel="Remove from this playlist"
              right={
                isLikedView
                  ? undefined
                  : (song, index) => (
                      <div className="hidden shrink-0 items-center sm:flex">
                        <Tooltip content="Move up" classNames={{ content: "glass text-xs" }}>
                          <button
                            type="button"
                            aria-label={`Move ${song.title} up`}
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="grid size-8 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Move down" classNames={{ content: "glass text-xs" }}>
                          <button
                            type="button"
                            aria-label={`Move ${song.title} down`}
                            onClick={() => move(index, 1)}
                            disabled={index === songs.length - 1}
                            className="grid size-8 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    )
              }
            />
          )}
        </>
      )}

      <RenamePlaylistDialog playlist={renaming ? playlist : null} onClose={() => setRenaming(false)} />
      <DeletePlaylistDialog
        playlist={deleting ? playlist : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => router.replace("/library")}
      />
    </div>
  );
}
