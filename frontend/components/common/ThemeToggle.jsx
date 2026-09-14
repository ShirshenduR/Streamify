"use client";

import { cn } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/useUi";

export default function ThemeToggle({ variant = "icon", className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  // Assume dark until mounted so the server and first client render agree.
  const isDark = !mounted || resolvedTheme !== "light";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-500 transition hover:bg-white/5 hover:text-foreground",
          className
        )}
      >
        {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        {isDark ? "Light appearance" : "Dark appearance"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground",
        className
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
