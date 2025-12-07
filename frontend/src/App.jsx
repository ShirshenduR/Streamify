import BottomMenu from "@/components/BottomMenu";
import MiniPlayer from "@/components/Miniplayer";
import Navbar from "@/components/Navbar";
import { PlayerProvider } from "@/hooks/usePlayer";
import { SearchProvider } from "@/hooks/useSearch";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <PlayerProvider>
          <main className="w-full h-full">
            <Navbar />
            <section className="w-full min-h-screen z-0 p-4 pb-32 md:pb-24 overflow-x-hidden">
              <Outlet />
            </section>
            <section className="fixed bottom-0 left-0 right-0 w-full bg-background text-foreground z-50 border-t-1 border-t-content2">
              <MiniPlayer />
              <BottomMenu />
            </section>
          </main>
        </PlayerProvider>
      </SearchProvider>
    </QueryClientProvider>
  );
}
