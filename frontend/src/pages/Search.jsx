import Page from "@/components/page/Page";
import PageTitle from "@/components/page/PageTitle";
import SongItem from "@/components/SongItem";
import { usePlayer } from "@/hooks/usePlayer";
import { useSearchList } from "@/hooks/useSearch";
import { Listbox, ListboxItem, Spinner } from "@heroui/react";

function SearchPage() {
  const searchList = useSearchList();
  const { playSong } = usePlayer();
  return (
    <Page>
      <PageTitle className="mb-4">Search Results</PageTitle>
      {searchList.error && <p>{searchList.error.message}</p>}
      {searchList.loading ? (
        <div className="flex h-40 justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <Listbox aria-label="Search Results" variant="flat" classNames={{ list: "gap-2" }}>
          {searchList.items.map((song) => (
            <ListboxItem key={song.id} onClick={() => playSong(song)}>
              <SongItem song={song} />
            </ListboxItem>
          ))}
        </Listbox>
      )}
    </Page>
  );
}

export default SearchPage;
