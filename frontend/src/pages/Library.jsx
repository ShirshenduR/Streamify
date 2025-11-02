import Page from "@/components/page/Page";
import PageTitle from "@/components/page/PageTitle";
import PlaylistCard from "@/components/PlaylistCard";
import SongGrid from "@/components/SongGrid";
import { getLikedSongs, getPlaylistDetail, getPlaylists } from "@/utils/api";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Library({ showSearch, setShowSearch }) {
  const [playlists, setPlaylists] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const allPlaylists = useMemo(
    () => [
      {
        id: "liked",
        name: "Liked Songs",
        description: "Your favorite tracks",
        image: "",
        songs: likedSongs,
      },
      ...playlists.map((p) => ({ ...p, songs: [] })),
    ],
    [playlists, likedSongs]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlaylistId = useMemo(() => searchParams.get("playlistId"), [searchParams]);
  const currentPlaylist = useMemo(
    () => allPlaylists.find((p) => p.id === currentPlaylistId) || {},
    [allPlaylists, currentPlaylistId]
  );
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const showSongs = currentPlaylistId !== null;

  useEffect(() => {
    getPlaylists().then((data) => setPlaylists(data.playlists || []));
    getLikedSongs().then((data) => setLikedSongs(data.songs || []));
  }, []);

  useEffect(() => {
    if (currentPlaylistId && currentPlaylistId !== "liked") {
      getPlaylistDetail(currentPlaylistId).then((data) => {
        setPlaylistSongs(data.songs || []);
      });
    } else {
      setPlaylistSongs(currentPlaylist.songs);
    }
  }, [currentPlaylistId, currentPlaylist.songs]);

  return (
    <Page className="flex flex-col items-center">
      <div className="w-full max-w-full max-auto flex flex-col">
        <Breadcrumbs size="lg" className="mb-8">
          <BreadcrumbItem href="/library">
            <PageTitle className="m-0">Library</PageTitle>
          </BreadcrumbItem>
          {currentPlaylistId && (
            <BreadcrumbItem>
              <PageTitle className="m-0">{currentPlaylist?.name}</PageTitle>
            </BreadcrumbItem>
          )}
        </Breadcrumbs>

        {!showSongs ? (
          <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6">
            {allPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => {
                  setSearchParams({ playlistId: playlist.id });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {playlistSongs?.length === 0 ? (
              <div className="library-empty">No songs found.</div>
            ) : (
              <SongGrid songs={playlistSongs} />
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
