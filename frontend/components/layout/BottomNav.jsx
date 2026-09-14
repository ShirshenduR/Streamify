"use client";

import { cn } from "@heroui/react";
import { Home, LibraryBig, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_NAV_LINKS } from "@/lib/site";

const NAV_ICONS = { home: Home, search: Search, sparkles: Sparkles, library: LibraryBig };

export default function BottomNav({ className }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "glass-bar pb-safe z-40 flex shrink-0 items-stretch justify-around border-t border-[var(--color-hairline-soft)] px-1 pt-1.5 lg:hidden",
        className
      )}
    >
      {MOBILE_NAV_LINKS.map((link) => {
        const Icon = NAV_ICONS[link.icon] ?? Home;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition",
              active ? "text-primary" : "text-foreground-500 hover:text-foreground"
            )}
          >
            <Icon className="size-[22px]" />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
