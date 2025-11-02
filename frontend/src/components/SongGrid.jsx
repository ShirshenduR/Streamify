import { usePlayer } from "@/hooks/usePlayer";
import SongCard from "./SongCard";

export default function SongGrid({ songs }) {
  const { playSong } = usePlayer();
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6">
      {songs &&
        songs.map((song) => (
          <SongCard key={song.id} song={song} onClick={() => playSong(song, songs)} />
        ))}
    </div>
  );
}
