"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { readStore, STORE_KEYS, writeStore } from "@/lib/storage";

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent;
    const iOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document);
    setIsIos(iOSDevice && !standalone);

    setDismissed(Boolean(readStore(STORE_KEYS.installDismissed, false)));
  }, []);

  // Registers the service worker so the app works offline once installed.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // Skipped in development: a cached dev bundle is far more confusing than useful.
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* installability is a bonus; never surface this to the user */
    });
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      // Keep the event so we can trigger the prompt from our own button.
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return false;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice?.outcome === "accepted") {
      setIsStandalone(true);
      return true;
    }
    return false;
  }, [installEvent]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    writeStore(STORE_KEYS.installDismissed, true);
  }, []);

  const value = useMemo(
    () => ({
      canInstall: Boolean(installEvent) && !isStandalone && !dismissed,
      showIosHint: isIos && !isStandalone && !dismissed,
      isStandalone,
      promptInstall,
      dismissInstall,
    }),
    [installEvent, isStandalone, isIos, dismissed, promptInstall, dismissInstall]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider");
  return context;
}
