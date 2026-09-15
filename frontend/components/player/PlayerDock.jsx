"use client";

import { useState } from "react";

import BottomNav from "@/components/layout/BottomNav";

import NowPlaying from "./NowPlaying";
import PlayerBar from "./PlayerBar";
import QueuePanel from "./QueuePanel";

/**
 * Everything that floats over the bottom of the page: the player and, on phones,
 * the primary navigation.
 *
 * The wrapper is absolutely positioned and `pointer-events-none`, so the gaps
 * around the pills stay click-through while the pills themselves opt back in.
 * That is also what lets page content scroll behind them, which is the only
 * reason the frosted glass reads as glass rather than as a dark bar.
 *
 * The overlays are deliberately rendered *outside* that wrapper: `pointer-events`
 * is inherited, and a full-screen sheet nested inside a `none` ancestor would
 * swallow every tap.
 */
export default function PlayerDock() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  return (
    <>
      <div className="pb-dock pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col gap-2 px-3 sm:px-4">
        <div className="pointer-events-auto">
          <PlayerBar
            onExpand={() => setShowPlayer(true)}
            onOpenQueue={() => setShowQueue(true)}
          />
        </div>
        <div className="pointer-events-auto lg:hidden">
          <BottomNav />
        </div>
      </div>

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
