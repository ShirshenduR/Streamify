import { Card, Image } from "@heroui/react";

export default function SongCard({ song, onClick }) {
  return (
    <Card
      isPressable={true}
      onPress={() => onClick(song)}
      className="rounded-sm bg-transparent transition-all cursor-pointer hover:scale-110"
    >
      <div className="p-0 flex items-center mx-auto">
        <Image alt={song?.title} className="rounded-sm" src={song?.cover} />
      </div>
      <div className="text-sm text-left p-2 max-w-full">
        <p className="truncate font-medium text-primary" title={song?.title}>
          {song?.title}
        </p>
        <p className="truncate" title={song?.artist}>
          {song?.artist}
        </p>
        <p className="truncate text-default-600" title={song?.source}>
          {song?.source === "ytmusic" ? "YouTube Music" : "JioSaavn"}
        </p>
      </div>
    </Card>
  );
}
