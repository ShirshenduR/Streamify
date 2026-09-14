import { Suspense } from "react";

import { SongListSkeleton } from "@/components/common/States";
import SearchScreen from "@/components/search/SearchScreen";

export const metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-7">
          <SongListSkeleton rows={8} />
        </div>
      }
    >
      <SearchScreen />
    </Suspense>
  );
}
