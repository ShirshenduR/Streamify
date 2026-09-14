"use client";

import { cn } from "@heroui/react";
import { CheckCircle2, Download, Share, X } from "lucide-react";

import { usePwa } from "@/components/providers/PwaProvider";

/**
 * Install affordance.
 *
 * Chrome/Edge/Android hand us a `beforeinstallprompt` event we can replay from
 * our own button; iOS Safari never fires it, so there we explain the Share sheet
 * route instead of showing a button that would do nothing.
 */
export default function InstallPrompt({ variant = "banner", className }) {
  const { canInstall, showIosHint, isStandalone, promptInstall, dismissInstall } = usePwa();

  if (variant === "inline") {
    if (isStandalone) {
      return (
        <div className={cn("flex items-center gap-3 text-sm text-foreground-500", className)}>
          <CheckCircle2 className="size-4 text-emerald-400" />
          Streamify is installed on this device
        </div>
      );
    }
    if (canInstall) {
      return (
        <button
          type="button"
          onClick={promptInstall}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15",
            className
          )}
        >
          <Download className="size-4" />
          Install the app
        </button>
      );
    }
    if (showIosHint) {
      return (
        <p className={cn("flex items-center gap-2 text-sm text-foreground-500", className)}>
          <Share className="size-4" />
          Add to Home Screen from the Share menu to install
        </p>
      );
    }
    return null;
  }

  if (!canInstall && !showIosHint) return null;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5", className)}>
        {canInstall ? (
          <button
            type="button"
            onClick={promptInstall}
            className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm font-medium transition hover:text-primary"
          >
            <Download className="size-[18px] shrink-0 text-primary" />
            <span className="truncate">Install Streamify</span>
          </button>
        ) : (
          <p className="flex min-w-0 flex-1 items-center gap-3 text-sm text-foreground-500">
            <Share className="size-[18px] shrink-0" />
            <span className="truncate">Add to Home Screen</span>
          </p>
        )}
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss install prompt"
          className="grid size-6 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("glass flex items-center gap-4 rounded-3xl p-4", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        <Download className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight">Install Streamify</p>
        <p className="truncate text-xs text-foreground-500">
          {canInstall
            ? "Add it to your home screen for full-screen, offline-ready listening."
            : "Tap Share, then “Add to Home Screen” to install."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canInstall ? (
          <button
            type="button"
            onClick={promptInstall}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss install prompt"
          className="grid size-8 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
