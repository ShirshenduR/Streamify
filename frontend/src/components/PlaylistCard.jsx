import { Card, CardBody, CardFooter, Image } from "@heroui/react";

export default function PlaylistCard({ playlist, onClick }) {
  // Get up to 4 most recent songs for album art collage
  const covers = (playlist.songs || [])
    .slice(-4)
    .reverse()
    .map((s) => s.cover);
  return (
    <Card isPressable onPress={() => onClick(playlist)} className="hover:scale-110">
      <CardBody className="overflow-visible aspect-square">
        {covers.length === 0 ? (
          <div className="w-full h-full rounded-lg flex justify-center items-center bg-default">
            No Art
          </div>
        ) : covers.length === 1 ? (
          <Image alt={"cover"} className="object-cover rounded-xl" src={covers[0]} width={270} />
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2">
            {covers.map((c, i) => (
              <Image key={i} alt={c} className="object-cover rounded-lg" src={c} />
            ))}
          </div>
        )}
      </CardBody>
      <CardFooter className="flex flex-col justify-center items-center gap-1">
        <p className="text-lg font-bold text-primary truncate">{playlist.name}</p>
        <p className="text-sm truncate">{playlist.songs?.length || 0} songs</p>
      </CardFooter>
    </Card>
  );
}
