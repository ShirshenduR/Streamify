import { searchSongs } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

async function getRandomSong() {
  const letters = "abcdefghijklmnopqrstuvwxyz";

  let allSongs = [];
  for (let i = 0; i < 3; i++) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const results = await searchSongs(randomLetter);
    allSongs = allSongs.concat(results.filter((song) => song.source === "jiosaavn"));
  }

  const uniqueSongs = Array.from(new Map(allSongs.map((s) => [s.id, s])).values());
  return uniqueSongs.slice(0, 18); // Show up to 18 unique JioSaavn songs
}

export function useRandomSongs() {
  return useQuery({
    queryKey: ["randomSongs"],
    queryFn: getRandomSong,
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 60,
  });
}
