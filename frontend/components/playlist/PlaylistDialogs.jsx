"use client";

import {
  Button,
  cn,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { Check, ListMusic, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddToPlaylist,
  useCreatePlaylist,
  useDeletePlaylist,
  usePlaylists,
  useRenamePlaylist,
} from "@/lib/queries";
import { gradientFor } from "@/lib/site";

const MODAL_CLASSES = { base: "glass", backdrop: "bg-black/60 backdrop-blur-sm" };

export function CreatePlaylistDialog({ open, onClose }) {
  const { uid } = useAuth();
  const createPlaylist = useCreatePlaylist(uid);
  const toast = useToast();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const playlist = await createPlaylist.mutateAsync(trimmed);
      toast.success(`Created “${playlist.name}”`);
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not create the playlist.");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="sm" classNames={MODAL_CLASSES} placement="center">
      <ModalContent>
        <ModalHeader className="text-lg font-bold tracking-tight">New playlist</ModalHeader>
        <ModalBody>
          <Input
            autoFocus
            label="Name"
            value={name}
            onValueChange={setName}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            maxLength={120}
            variant="flat"
            classNames={{ inputWrapper: "bg-glass-faint" }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isLoading={createPlaylist.isPending}
            isDisabled={!name.trim()}
            onPress={submit}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function AddToPlaylistDialog({ song, onClose }) {
  const { uid } = useAuth();
  const { data, isLoading } = usePlaylists(uid);
  const addToPlaylist = useAddToPlaylist(uid);
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const createPlaylist = useCreatePlaylist(uid);

  const playlists = data?.playlists ?? [];
  const open = Boolean(song);

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewName("");
    }
  }, [open]);

  const addTo = async (playlistId, name) => {
    try {
      await addToPlaylist.mutateAsync({ playlistId, song });
      toast.success(`Added to “${name}”`, { title: song.title });
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not add the song.");
    }
  };

  const createAndAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const playlist = await createPlaylist.mutateAsync(trimmed);
      await addToPlaylist.mutateAsync({ playlistId: playlist.id, song });
      toast.success(`Added to “${playlist.name}”`, { title: song.title });
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not create the playlist.");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="sm"
      classNames={MODAL_CLASSES}
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex-col items-start gap-0.5">
          <span className="text-lg font-bold tracking-tight">Add to playlist</span>
          <span className="truncate text-xs font-normal text-foreground-500">{song?.title}</span>
        </ModalHeader>
        <ModalBody className="gap-1">
          {isLoading ? (
            <div className="grid place-items-center py-8">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => addTo(playlist.id, playlist.name)}
                  disabled={addToPlaylist.isPending}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-glass-hover disabled:opacity-50"
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white/90",
                      gradientFor(playlist.name)
                    )}
                  >
                    <ListMusic className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{playlist.name}</span>
                    <span className="block truncate text-xs text-foreground-500">
                      {playlist.songCount} {playlist.songCount === 1 ? "song" : "songs"}
                    </span>
                  </span>
                  <Check className="size-4 shrink-0 text-foreground-500 opacity-0" />
                </button>
              ))}

              {creating ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    autoFocus
                    size="sm"
                    placeholder="Playlist name"
                    value={newName}
                    onValueChange={setNewName}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") createAndAdd();
                    }}
                    variant="flat"
                    classNames={{ inputWrapper: "bg-glass-faint" }}
                  />
                  <Button
                    size="sm"
                    color="primary"
                    isLoading={createPlaylist.isPending || addToPlaylist.isPending}
                    isDisabled={!newName.trim()}
                    onPress={createAndAdd}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="mt-2 flex items-center gap-3 rounded-xl border-t border-[var(--color-hairline-soft)] px-2 py-3 text-left text-sm font-medium transition hover:bg-glass-hover"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-glass-faint">
                    <Plus className="size-4" />
                  </span>
                  New playlist
                </button>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function RenamePlaylistDialog({ playlist, onClose }) {
  const { uid } = useAuth();
  const renamePlaylist = useRenamePlaylist(uid);
  const toast = useToast();
  const [name, setName] = useState("");

  useEffect(() => {
    if (playlist) setName(playlist.name);
  }, [playlist]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !playlist) return;
    try {
      await renamePlaylist.mutateAsync({ playlistId: playlist.id, name: trimmed });
      toast.success("Playlist renamed");
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not rename the playlist.");
    }
  };

  return (
    <Modal
      isOpen={Boolean(playlist)}
      onClose={onClose}
      size="sm"
      classNames={MODAL_CLASSES}
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="text-lg font-bold tracking-tight">Rename playlist</ModalHeader>
        <ModalBody>
          <Input
            autoFocus
            label="Name"
            value={name}
            onValueChange={setName}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            maxLength={120}
            variant="flat"
            classNames={{ inputWrapper: "bg-glass-faint" }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isLoading={renamePlaylist.isPending}
            isDisabled={!name.trim()}
            onPress={submit}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function DeletePlaylistDialog({ playlist, onClose, onDeleted }) {
  const { uid } = useAuth();
  const deletePlaylist = useDeletePlaylist(uid);
  const toast = useToast();

  const confirm = async () => {
    if (!playlist) return;
    try {
      await deletePlaylist.mutateAsync(playlist.id);
      toast.success(`Deleted “${playlist.name}”`);
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Could not delete the playlist.");
    }
  };

  return (
    <Modal
      isOpen={Boolean(playlist)}
      onClose={onClose}
      size="sm"
      classNames={MODAL_CLASSES}
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="text-lg font-bold tracking-tight">Delete playlist?</ModalHeader>
        <ModalBody>
          <p className="text-sm text-foreground-500">
            “{playlist?.name}” will be deleted. The songs themselves stay in the catalogue.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="danger" isLoading={deletePlaylist.isPending} onPress={confirm}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
