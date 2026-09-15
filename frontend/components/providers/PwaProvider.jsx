"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { buildInstallGuide, detectDevice } from "@/lib/platform";
import { readStore, STORE_KEYS, writeStore } from "@/lib/storage";

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [device, setDevice] = useState({ device: "other", browser: "other", isMobile: false, ready: false });
  const [dismissed, setDismissed] = useState(true);
  const [justInstalled, setJustInstalled] = useState(false);

  // Everything is measured after mount: none of it is known while rendering on
  // the server, and guessing would break hydration.
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    setDevice(detectDevice());
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
      // Keep the event so our own button can trigger the browser's prompt.
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
      setJustInstalled(true);
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

  const guide = useMemo(
    () => buildInstallGuide({ device: device.device, browser: device.browser, canPrompt: Boolean(installEvent) }),
    [device, installEvent]
  );

  const value = useMemo(
    () => ({
      // A native prompt is available right now (Chromium on Android/desktop).
      canInstall: Boolean(installEvent),
      // What this device should actually be told, and how.
      guide,
      supported: guide.supported,
      // Worth showing only while running in a browser and not dismissed.
      showPrompt: guide.supported && !isStandalone && !dismissed,
      showUnsupported: !guide.supported && !isStandalone && !dismissed,
      isStandalone,
      justInstalled,
      device,
      promptInstall,
      dismissInstall,
    }),
    [installEvent, guide, isStandalone, dismissed, justInstalled, device, promptInstall, dismissInstall]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider");
  return context;
}
