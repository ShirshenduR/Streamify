export default function SongItem({ song }) {
  return (
    <div className="flex flex-1 gap-4 items-center justify-start overflow-hidden">
      <div className="w-8 h-8 md:w-12 md:h-12 aspect-square bg-content4 flex items-center justify-center">
        {song && <img src={song.cover} alt={song.title} />}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm lg:text-base text-primary font-semibold truncate">
          {song?.title ?? ""}
        </p>
        <p className="text-xs lg:text-sm truncate">{song?.artist ?? ""}</p>
      </div>
    </div>
  );
}
