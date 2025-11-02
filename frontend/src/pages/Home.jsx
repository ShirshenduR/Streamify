import Page from "@/components/page/Page";
import PageTitle from "@/components/page/PageTitle";
import SongGrid from "@/components/SongGrid";
import { useRandomSongs } from "@/services/songs";

export default function Home() {
  const { data: randomSongs, isLoading } = useRandomSongs();

  return (
    <Page>
      <PageTitle>Recommended For You</PageTitle>
      {!isLoading && <SongGrid songs={randomSongs} />}
    </Page>
  );
}
