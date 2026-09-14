"use client";

import { useState } from "react";

import NowPlaying from "./NowPlaying";
import PlayerBar from "./PlayerBar";
import QueuePanel from "./QueuePanel";

/** Owns the player's overlay state so the bar stays a pure presentational unit. */
export default function PlayerDock() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  return (
    <>
      <PlayerBar onExpand={() => setShowPlayer(true)} onOpenQueue={() => setShowQueue(true)} />
      <NowPlaying
        open={showPlayer}
        onClose={() => setShowPlayer(false)}
        onOpenQueue={() => {
          setShowPlayer(false);
          setShowQueue(true);
        }}
      />
      <QueuePanel open={showQueue} onClose={() => setShowQueue(false)} />
    </>
  );
}
