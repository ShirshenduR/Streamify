"use client";

import { cn } from "@heroui/react";
import { CheckCircle2, Download, Share, X } from "lucide-react";

import { usePwa } from "@/components/providers/PwaProvider";

function Steps({ steps, className }) {
  return (
    <ol className={cn("space-y-1.5", className)}>
      {steps.map((step, index) => (
        <li key={step} className="flex gap-2.5 text-xs leading-relaxed text-foreground-500">
          <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-glass-faint text-[10px] font-semibold text-foreground-400">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The install recommendation, tailored to the device it is rendered on.
 *
 * A Chromium browser hands us a prompt we can replay from our own button; every
 * other case needs the person to do it through browser UI we cannot reach, so we
 * show the exact steps for their platform instead of a button that does nothing.
 */
export default function InstallPrompt({ variant = "banner", className }) {
  const { showPrompt, showUnsupported, isStandalone, canInstall, guide, promptInstall, dismissInstall } =
    usePwa();

  const Icon = guide.mode === "native" ? Download : Share;

  if (variant === "inline") {
    if (isStandalone) {
      return (
        <div className={cn("flex items-center gap-3 text-sm text-foreground-500", className)}>
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          Installed on this device
        </div>
      );
    }
    if (!guide.supported) {
      return (
        <p className={cn("text-sm text-foreground-500", className)}>{guide.summary}</p>
      );
    }
    return (
      <div className={cn("w-full", className)}>
        {canInstall ? (
          <button
            type="button"
            onClick={promptInstall}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15"
          >
            <Download className="size-4" />
            Install the app
          </button>
        ) : (
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4 text-primary" />
              {guide.title}
            </p>
            <Steps steps={guide.steps} className="mt-2" />
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    // Nothing useful to say on this device, so say nothing.
    if (!showPrompt || !guide.supported) return null;
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

  // Unsupported browsers still get told what to do instead, but only once and
  // only where the advice is actionable (opening in Safari or Chrome).
  if (showUnsupported) {
    return (
      <div className={cn("glass flex items-start gap-3 rounded-3xl p-4", className)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-glass-faint text-foreground-500">
          <Share className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{guide.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground-500">{guide.summary}</p>
        </div>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss install prompt"
          className="grid size-8 shrink-0 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  if (!showPrompt || !guide.supported) return null;

  return (
    <div className={cn("glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight">{guide.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground-500">{guide.summary}</p>
        {guide.mode === "manual" && guide.steps ? (
          <Steps steps={guide.steps} className="mt-3" />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
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
