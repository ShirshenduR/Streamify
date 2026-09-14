"use client";

import { cn, Tooltip } from "@heroui/react";
import { Home, LibraryBig, ListMusic, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import InstallPrompt from "@/components/common/InstallPrompt";
import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/lib/queries";
import { gradientFor, NAV_LINKS } from "@/lib/site";

const NAV_ICONS = { home: Home, search: Search, sparkles: Sparkles, library: LibraryBig };

export default function Sidebar({ className, onCreatePlaylist }) {
  const pathname = usePathname();
  const { uid } = useAuth();
  const { data } = usePlaylists(uid);
  const playlists = data?.playlists ?? [];

  return (
    <aside
      className={cn(
        "glass-bar m-3 hidden w-[268px] shrink-0 flex-col overflow-hidden rounded-3xl lg:flex",
        className
      )}
    >
      <div className="px-5 pb-3 pt-5">
        <Link href="/home" className="inline-flex rounded-2xl outline-none">
          <Logo size={26} />
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_LINKS.map((link) => {
          const Icon = NAV_ICONS[link.icon] ?? Home;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-foreground hairline-top"
                  : "text-foreground-500 hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-primary")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-500">
            Playlists
          </h2>
          <Tooltip content="New playlist" placement="right" classNames={{ content: "glass-card" }}>
            <button
              type="button"
              onClick={onCreatePlaylist}
              aria-label="New playlist"
              className="grid size-6 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </Tooltip>
        </div>

        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-xs text-foreground-500">
              Playlists you create will live here.
            </p>
          ) : (
            playlists.map((playlist) => {
              const href = `/library/${playlist.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={playlist.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-1.5 transition",
                    active ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white/90",
                      gradientFor(playlist.name)
                    )}
                  >
                    <ListMusic className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{playlist.name}</span>
                    <span className="block truncate text-xs text-foreground-500">
                      {playlist.songCount} {playlist.songCount === 1 ? "song" : "songs"}
                    </span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-[var(--color-hairline-soft)] p-3">
        <InstallPrompt variant="compact" />
        <ThemeToggle variant="row" />
      </div>
    </aside>
  );
}
