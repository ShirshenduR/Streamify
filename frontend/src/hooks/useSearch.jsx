import { searchSongs } from "@/utils/api";
import { useAsyncList } from "@react-stately/data";
import _ from "lodash";
import { createContext, useContext, useMemo } from "react";

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const debouncedSearch = useMemo(
    () =>
      _.debounce(async (text, signal) => {
        let search = text?.trim();
        if (search && search.length < 2) return [];
        try {
          return await searchSongs(text, signal);
        } catch (err) {
          console.error(err);
          return [];
        }
      }, 500),
    []
  );

  const searchList = useAsyncList({
    async load({ signal, filterText }) {
      return { items: await debouncedSearch(filterText, signal) };
    },
  });

  return <SearchContext.Provider value={searchList}>{children}</SearchContext.Provider>;
}

export function useSearchList() {
  let ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearchList must be used within a SearchProvider");
  }
  return ctx;
}
