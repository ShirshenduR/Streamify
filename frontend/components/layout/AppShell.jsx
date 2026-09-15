"use client";

import { useCallback, useState } from "react";

import AmbientBackground from "@/components/common/AmbientBackground";
import PlayerDock from "@/components/player/PlayerDock";
import { CreatePlaylistDialog } from "@/components/playlist/PlaylistDialogs";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLikeState } from "@/hooks/useLike";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }) {
  const { toggle } = useLikeState();
  const [isCreatingPlaylist, setCreatingPlaylist] = useState(false);

  const onToggleLike = useCallback((song) => toggle(song), [toggle]);
  useKeyboardShortcuts({ onToggleLike });

  return (
    <div className="flex h-dvh overflow-hidden">
      <AmbientBackground />

      <Sidebar onCreatePlaylist={() => setCreatingPlaylist(true)} />

      {/* relative: the floating dock is positioned against this column. */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* The scroll area runs the full height so content passes *behind* the
            floating dock, which is what gives its glass something to blur. The
            padding only has to keep the end of the page reachable. */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] pb-44 lg:pb-32">{children}</div>
        </main>
        <PlayerDock />
      </div>

      <CreatePlaylistDialog open={isCreatingPlaylist} onClose={() => setCreatingPlaylist(false)} />
    </div>
  );
}
