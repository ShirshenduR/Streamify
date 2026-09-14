# Streamify — Next.js frontend

An installable PWA (App Router) that talks to Django through a same-origin `/api/*` proxy. Read the
root `README.md` first for the architecture.

## Setup

```bash
npm install
cp .env.example .env.local     # add your Firebase web config
npm run dev                    # http://localhost:3000
```

Django must be running on `127.0.0.1:8000` (see `../backend/README.md`); `/api/*` is proxied there
automatically. Override the target with `VITE_BACKEND_API_URL` if you host Django elsewhere.

## Scripts

| Script           | What it does                                                    |
| ---------------- | --------------------------------------------------------------- |
| `npm run dev`    | Development server with HMR                                     |
| `npm run build`  | Production build (emits `.next/standalone` for the Docker image) |
| `npm start`      | Serve a production build                                        |
| `npm run lint`   | ESLint (flat config; hooks rules)                               |
| `npm run icons`  | Regenerate the PWA icons and `og.png` from the logo geometry     |

## Layout

```
app/
  layout.jsx              root: metadata, viewport, providers
  page.jsx                sign-in screen (/)
  manifest.js             PWA manifest
  api/config/route.js     Firebase config, read from env at runtime
  offline/page.jsx        offline fallback (precached by the service worker)
  (app)/                  signed-in shell — protected by AuthGate
    home/ search/ for-you/ library/[id]/ profile/
components/
  providers/              Providers, ToastProvider, PwaProvider
  layout/                 AppShell, Sidebar, TopBar, SearchField, BottomNav, AuthGate
  player/                 PlayerDock, PlayerBar, NowPlaying, QueuePanel, controls
  song/ playlist/ common/ search/ auth/
hooks/                    usePlayer, useAuth, useLike, useUi, useKeyboardShortcuts
lib/                      api, queries, firebase, storage, format, site, glass
public/                   sw.js, logo, generated icons
```

## Notes for contributors

- **Runtime config, not build-time.** `VITE_FIREBASE_*` is read in `app/api/config/route.js` when a
  request arrives. The Docker image is built once and Render injects env vars at boot, so inlining
  keys at build time would ship empty values.
- **`skipTrailingSlashRedirect: true`** in `next.config.mjs` is load-bearing. Without it Next
  308-redirects `/api/.../` before the rewrite runs, which breaks every API call (and hard-fails
  POSTs). Django accepts both spellings.
- **The design language is frosted glass.** Use the `glass`, `glass-bar`, `glass-card` and
  `hairline-top` utilities from `app/globals.css` rather than inventing new surfaces, and the
  `bg-glass-*` colour tokens so light mode keeps working. HeroUI's own overlays take `glass` via
  `classNames={{ content: "glass" }}` or the inline styles in `lib/glass.js`.
- **Mobile first.** Touch targets are ≥44px, hover-only affordances are always visible on small
  screens, the shell is `h-dvh` with an inner scroller, and bottom areas respect
  `env(safe-area-inset-bottom)` through `pb-safe`.
- **The player is a singleton.** `PlayerProvider` owns one `Audio` element; components read it
  through `usePlayer()`. State that must survive re-renders lives in refs, and audio listeners are
  attached once so a `timeupdate` tick cannot re-bind them.
- **Adding a query/mutation?** Put it in `lib/queries.js` so cache invalidation stays in one place.

## PWA

`public/sw.js` caches the app shell and static assets, serves `/offline` when a navigation fails, and
deliberately **never** touches `/api/*` or the cross-origin music CDN — stale library data and broken
range requests are worse than a spinner. It is registered only in production builds.
