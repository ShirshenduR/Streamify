/**
 * Device/browser detection for the install recommendation.
 *
 * Installing a web app is not uniform: Chrome and Edge fire
 * `beforeinstallprompt`, iOS only permits it from Safari via the Share sheet,
 * desktop Safari hides it in the File menu, and Firefox cannot do it at all. One
 * generic "install the app" button is therefore wrong on most devices, so this
 * module works out what to actually tell the person in front of it.
 */

export const DEVICE = {
  IOS: "ios",
  ANDROID: "android",
  MAC: "macos",
  WINDOWS: "windows",
  LINUX: "linux",
  OTHER: "other",
};

export const BROWSER = {
  SAFARI: "safari",
  CHROME: "chrome",
  EDGE: "edge",
  FIREFOX: "firefox",
  OTHER: "other",
};

const UNKNOWN = { device: DEVICE.OTHER, browser: BROWSER.OTHER, isMobile: false, ready: false };

export function detectDevice() {
  if (typeof window === "undefined") return UNKNOWN;
  const ua = window.navigator.userAgent;

  // An iPad on iPadOS 13+ reports itself as a Macintosh; the touch check is what
  // separates it from a real desktop.
  const touchMac = ua.includes("Macintosh") && "ontouchend" in document;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || touchMac;
  const isAndroid = /Android/.test(ua);

  const device = isIOS
    ? DEVICE.IOS
    : isAndroid
      ? DEVICE.ANDROID
      : /Macintosh|Mac OS X/.test(ua)
        ? DEVICE.MAC
        : /Windows/.test(ua)
          ? DEVICE.WINDOWS
          : /Linux|X11|CrOS/.test(ua)
            ? DEVICE.LINUX
            : DEVICE.OTHER;

  // Order matters: every Chromium browser claims to be Safari, and Edge claims to
  // be Chrome. Opera is Chromium too, so it installs natively.
  const browser = /Edg[A-Z]?\//.test(ua)
    ? BROWSER.EDGE
    : /(OPR|Opera)\//.test(ua)
      ? BROWSER.CHROME
      : /(Firefox|FxiOS)\//.test(ua)
        ? BROWSER.FIREFOX
        : /(Chrome|CriOS)\//.test(ua)
          ? BROWSER.CHROME
          : /Safari\//.test(ua)
            ? BROWSER.SAFARI
            : BROWSER.OTHER;

  return { device, browser, isMobile: isIOS || isAndroid, ready: true };
}

const BENEFIT = "Full screen, home-screen icon, and it opens without the browser chrome.";

/**
 * What to show this device, and how.
 *
 * `mode`:
 *   "native"      — we have a install event; show a button that triggers it
 *   "manual"      — installation works, but the person must do it themselves
 *   "unsupported" — this browser cannot install web apps at all
 */
export function buildInstallGuide({ device, browser, canPrompt }) {
  if (device === DEVICE.IOS) {
    if (browser === BROWSER.SAFARI) {
      return {
        supported: true,
        mode: "manual",
        title: "Add Streamify to your Home Screen",
        summary: BENEFIT,
        steps: [
          "Tap the Share button in the toolbar",
          "Scroll down and tap “Add to Home Screen”",
          "Tap Add",
        ],
      };
    }
    // Chrome, Firefox and Edge on iOS are all Safari underneath, and Apple only
    // allows a home-screen install from Safari itself.
    return {
      supported: false,
      mode: "unsupported",
      title: "Install from Safari",
      summary:
        "iPhone and iPad only allow home-screen installs from Safari. Open this page in Safari to add Streamify.",
    };
  }

  if (device === DEVICE.ANDROID) {
    if (canPrompt) return { supported: true, mode: "native", title: "Install Streamify", summary: BENEFIT };
    if (browser === BROWSER.FIREFOX) {
      return {
        supported: false,
        mode: "unsupported",
        title: "Install from Chrome",
        summary: "Firefox on Android cannot install web apps. Open this page in Chrome to add Streamify.",
      };
    }
    return {
      supported: true,
      mode: "manual",
      title: "Add Streamify to your Home screen",
      summary: BENEFIT,
      steps: [
        "Open the browser menu (⋮)",
        "Tap “Install app” or “Add to Home screen”",
        "Confirm",
      ],
    };
  }

  if (canPrompt) return { supported: true, mode: "native", title: "Install Streamify", summary: BENEFIT };

  if (device === DEVICE.MAC && browser === BROWSER.SAFARI) {
    return {
      supported: true,
      mode: "manual",
      title: "Add Streamify to your Dock",
      summary: "Safari can keep Streamify in the Dock as its own window.",
      steps: ["Open the File menu", "Choose “Add to Dock…”", "Click Add"],
    };
  }

  if (browser === BROWSER.FIREFOX) {
    return {
      supported: false,
      mode: "unsupported",
      title: "Install from Chrome or Edge",
      summary: "Firefox cannot install web apps. Chrome or Edge can add Streamify as an app.",
    };
  }

  // Chrome, Edge and other Chromium desktops that have not offered an event yet
  // (they usually do, once the app is considered installable).
  return {
    supported: true,
    mode: "manual",
    title: "Install Streamify",
    summary: BENEFIT,
    steps: ["Open the browser menu", "Choose “Install Streamify”", "Confirm"],
  };
}
