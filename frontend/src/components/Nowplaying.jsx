import { useMobile, useTablet } from "@/hooks/useMediaQuery";
import { usePlayer } from "@/hooks/usePlayer";
import { downloadSong } from "@/utils/api";
import { Button, cn, Slider } from "@heroui/react";
import {
  ArrowDownToLineIcon,
  FastForwardIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  SkipBackIcon,
  SkipForwardIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Nowplaying({ open, onClose }) {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    nextSong,
    prevSong,
    seek,
    duration,
    currentTime,
    likedSongs,
    likeSong,
  } = usePlayer();
  const [dragValue, setDragValue] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [jiosaavnAlternative, setJiosaavnAlternative] = useState(null);
  const isTablet = useTablet();
  const isMobile = useMobile();

  const isLiked = currentSong && likedSongs.some((s) => s.id === currentSong.id);

  const handleDownload = async () => {
    if (!currentSong) return;
    setDownloading(true);
    try {
      const data = await downloadSong(currentSong.id, currentSong.source);
      const url = data.url || data.downloadUrl || data.audioUrl;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!currentSong) return;
    await likeSong(currentSong);
  };

  // Try to play song, handle YTMusic error and search JioSaavn fallback
  useEffect(() => {
    setPlaybackError(null);
    setJiosaavnAlternative(null);
    if (!currentSong) return;
    if (currentSong.source === "ytmusic") {
      // Listen for playback error event (customize as per your player logic)
      const audio = document.querySelector("audio");
      if (!audio) return;
      const onError = async () => {
        setPlaybackError("YouTube Music is currently unavailable due to restrictions.");
        // Search for JioSaavn alternative
        const { searchSongs } = await import("../utils/api");
        const results = await searchSongs(`${currentSong.title} ${currentSong.artist}`);
        const jio = results.find((s) => s.source === "jiosaavn");
        if (jio) setJiosaavnAlternative(jio);
      };
      audio.addEventListener("error", onError);
      return () => audio.removeEventListener("error", onError);
    }
  }, [currentSong]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-1000",
        open ? "block pointer-events-auto animate-appearance-in" : "hidden pointer-events-none"
      )}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background w-screen h-screen z-1000 overflow-hidden">
        <div className="flex justify-end items-center p-4">
          <Button onPress={onClose} variant="light" isIconOnly>
            <X />
          </Button>
        </div>

        <div className="flex flex-col justify-center items-center gap-4 p-4">
          <div
            className="w-40 h-40 rounded-md bg-default bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentSong?.cover || ""})` }}
          ></div>

          <div className="w-full text-center">
            <p className="text-primary text-xl font-bold truncate">{currentSong?.title || ""}</p>
            <p className="text-base truncate">{currentSong?.artist || ""}</p>
            <p className="text-sm truncate">
              {currentSong?.source === "ytmusic" && "YouTube Music"}
              {currentSong?.source === "jiosaavn" && "JioSaavn"}
            </p>
          </div>
          <div className="w-full">
            <Slider
              aria-label="Seekbar"
              minValue={0}
              maxValue={duration || 0}
              value={dragValue ?? currentTime}
              step={0.1}
              size="sm"
              className="flex-1"
              onChange={(val) => setDragValue(val)} // update label while dragging
              onChangeEnd={(val) => {
                seek(val); // actually seek when released
                setDragValue(null); // reset to follow currentTime again
              }}
            />

            <div className="nowplaying-progress-times">
              <span>{formatTime(dragValue ?? currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex lg:flex-1 gap-4 items-center justify-end lg:justify-center">
            <Button
              isIconOnly
              aria-label="Previous"
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={prevSong}
            >
              <SkipBackIcon />
            </Button>

            <Button
              isIconOnly
              aria-label="Rewind"
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={() => seek(Math.max(0, currentTime - 10))}
            >
              <RewindIcon />
            </Button>

            <Button
              isIconOnly
              aria-label={isPlaying ? "Pause" : "Play"}
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={isPlaying ? pauseSong : resumeSong}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon className="border-foreground" />}
            </Button>

            <Button
              isIconOnly
              aria-label="Fast Forward"
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={() => seek(Math.min(duration, currentTime + 10))}
            >
              <FastForwardIcon />
            </Button>

            <Button
              isIconOnly
              aria-label="Next"
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={nextSong}
            >
              <SkipForwardIcon />
            </Button>
          </div>

          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="flat"
              aria-label={isLiked ? "Unlike" : "Like"}
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={handleLike}
            >
              {isLiked ? <HeartIcon fill="currentColor" strokeWidth={0} /> : <HeartIcon />}
              <span>{isLiked ? "Liked" : "Like"}</span>
            </Button>

            <Button
              aria-label="Download"
              variant="flat"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={handleDownload}
            >
              <ArrowDownToLineIcon />
              <span className="truncate">{downloading ? "Downloading..." : "Download"}</span>
            </Button>
          </div>
          {playbackError && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                margin: "1rem 0",
                textAlign: "center",
              }}
            >
              <p>{playbackError}</p>
              {jiosaavnAlternative ? (
                <button style={{ marginTop: "0.5rem" }} onClick={() => window.location.reload()}>
                  Play on JioSaavn
                </button>
              ) : (
                <p>Try searching for this song on JioSaavn or another source.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
