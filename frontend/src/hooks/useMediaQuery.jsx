import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export function useTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
}

export function useMobile() {
  return useMediaQuery("(max-width: 768px)");
}
