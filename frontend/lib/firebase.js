/**
 * Firebase is initialised lazily and asynchronously.
 *
 * The config is fetched from /api/config at runtime so the Docker image does not
 * need the Firebase keys at build time (Render only provides env vars when the
 * container boots). firebase itself is imported dynamically so it never lands in
 * the first-loaded bundle.
 */

let configPromise = null;
let firebasePromise = null;

async function loadConfig() {
  if (!configPromise) {
    configPromise = fetch("/api/config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }
  return configPromise;
}

/** Resolves to the Firebase handles, or null when the env vars are not set. */
export function getFirebase() {
  if (!firebasePromise) {
    firebasePromise = (async () => {
      const config = await loadConfig();
      if (!config?.apiKey || !config?.projectId) return null;

      const [{ initializeApp, getApps, getApp }, { getAuth, GoogleAuthProvider }] =
        await Promise.all([import("firebase/app"), import("firebase/auth")]);

      const app = getApps().length > 0 ? getApp() : initializeApp(config);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      return { app, auth, provider };
    })();
  }
  return firebasePromise;
}
