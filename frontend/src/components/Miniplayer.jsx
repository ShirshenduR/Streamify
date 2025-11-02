import { useMobile, useTablet } from "@/hooks/useMediaQuery";
import { usePlayer } from "@/hooks/usePlayer";
import { unlikeSong } from "@/utils/api";
import { Button, cn, Slider } from "@heroui/react";
import {
  HeartIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeOffIcon,
} from "lucide-react";
import { useState } from "react";
import Nowplaying from "./Nowplaying";
import SongItem from "./SongItem";

export default function MiniPlayer({ className }) {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    likedSongs,
    prevSong,
    nextSong,
    likeSong,
    volume,
    setAudioVolume,
  } = usePlayer();
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const isTablet = useTablet();
  const isMobile = useMobile();
  const [isLiked, setLiked] = useState(
    () => currentSong && likedSongs.some((s) => s.id === currentSong.id)
  );

  const handleVolumeChange = (newVolume) => {
    setAudioVolume(newVolume);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const handleLike = async () => {
    if (!currentSong) return;
    if (!isLiked) {
      await likeSong(currentSong);
    } else {
      await unlikeSong(currentSong);
    }

    setLiked((prev) => !prev);
  };

  const handleOpenNowPlaying = () => {
    setShowNowPlaying(true);
  };

  const handleCloseNowPlaying = () => {
    setShowNowPlaying(false);
  };

  return (
    <>
      <div
        className={cn(
          "w-full py-2 px-4 md:py-4 justify-between items-center gap-2 lg:gap-4",
          currentSong ? "flex" : "hidden lg:flex",
          className
        )}
        onClick={handleOpenNowPlaying}
        style={{ cursor: "pointer" }}
      >
        <SongItem song={currentSong} />
        <div className="flex lg:flex-1 gap-4 items-center justify-end lg:justify-center">
          <Button
            isIconOnly
            aria-label="Repeat"
            variant="light"
            disabled={!currentSong}
            size={isMobile || isTablet ? "sm" : "lg"}
            className="hidden md:inline-flex"
          >
            <RepeatIcon />
          </Button>
          <Button
            isIconOnly
            aria-label="Previous"
            variant="light"
            disabled={!currentSong}
            size={isMobile || isTablet ? "sm" : "lg"}
            className="hidden md:inline-flex"
            onPress={prevSong}
          >
            <SkipBackIcon />
          </Button>

          <Button
            isIconOnly
            aria-label={isPlaying ? "Pause" : "Play"}
            variant="light"
            disabled={!currentSong}
            onPress={togglePlay}
            size={isMobile || isTablet ? "sm" : "lg"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon className="border-foreground" />}
          </Button>
          <Button
            isIconOnly
            aria-label="Next"
            variant="light"
            disabled={!currentSong}
            size={isMobile || isTablet ? "sm" : "lg"}
            className="hidden md:inline-flex"
            onPress={nextSong}
          >
            <SkipForwardIcon />
          </Button>
          <Button
            isIconOnly
            aria-label="Shuffle"
            variant="light"
            disabled={!currentSong}
            size={isMobile || isTablet ? "sm" : "lg"}
            className="hidden md:inline-flex"
          >
            <ShuffleIcon />
          </Button>
        </div>
        <div className="hidden lg:flex flex-1 gap-4 justify-end">
          <Button
            isIconOnly
            aria-label={isLiked ? "Unlike" : "Like"}
            variant="light"
            disabled={!currentSong}
            size={isMobile || isTablet ? "sm" : "lg"}
            onPress={handleLike}
          >
            {isLiked ? <HeartIcon fill="currentColor" strokeWidth={0} /> : <HeartIcon />}
          </Button>

          <div className="relative group">
            <div
              className="group-hover:flex hidden h-30 absolute left-1/2 bottom-12 -translate-x-1/2 p-2 bg-background border-1 border-default rounded-sm"
              onMouseEnter={(e) => e.currentTarget.classList.add("flex")}
              onMouseLeave={(e) => e.currentTarget.classList.remove("flex")}
            >
              <Slider
                aria-label="Temperature"
                defaultValue={0.2}
                maxValue={1}
                minValue={0}
                orientation="vertical"
                size="sm"
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>

            <Button
              isIconOnly
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              variant="light"
              disabled={!currentSong}
              size={isMobile || isTablet ? "sm" : "lg"}
              onPress={() => setAudioVolume(volume > 0 ? 0 : 1)}
            >
              {volume > 0 ? <Volume2Icon /> : <VolumeOffIcon />}
            </Button>
          </div>
        </div>
      </div>
      <Nowplaying open={showNowPlaying} onClose={handleCloseNowPlaying} />
    </>
  );
}
