# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

EXTROVERTIDOS is a React SPA for discovering and publishing events ("panoramas") and local businesses ("Superguía") in the Región del Maule, Chile. Content goes through a moderation workflow (`pendiente` → `publicado`/`rechazado`) before appearing publicly. The app is in Spanish; keep UI copy, comments, and DB fields in Spanish to match the existing codebase.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run lint      # ESLint (flat config, eslint.config.js)
npm run preview   # Preview the production build locally
```

There is no test runner configured in this repo (no `test` script, no test files). Don't assume Jest/Vitest is available.

## Environment

Requires a `.env` file (see keys referenced in `src/lib/supabase.js`, `src/context/AuthContext.jsx`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_EMAILJS_*`, `VITE_GA_MEASUREMENT_ID`. `.env` is gitignored — never commit it or print its values.

## Architecture

### Data layer: `src/lib/database/`

All Supabase queries live here, split by domain (`events.js`, `businesses.js`, `admin.js`, `subscriptions.js`, `settings.js`, `roles.js`, `bans.js`, `favorites.js`, `likes.js`, `drafts.js`, `notifications.js`, `images.js`, `categories.js`, `businessCategories.js`, `businessInteractions.js`, `profiles.js`, `tags.js`). `src/lib/database/index.js` re-exports everything as the single public entry point — **import from `../lib/database`, not from the submodule directly**, unless the symbol isn't re-exported there.

`cache.js` implements a simple in-memory TTL cache (`get`/`set`/`invalidate`/`clear`) used by read-heavy queries (categories, business lists, admin stats). When adding a write, invalidate the matching cache key pattern via `invalidateCache()`.

### Two parallel content types, same lifecycle

- **Panoramas** (events, table `events`): created via `src/components/Home/Panorama/`, multi-step wizard in `components/wizard/`, orchestrated by `hooks/usePublicarFormV2.js` which composes smaller hooks (`useFormValidation`, `useImageManager`, `useDraftManager`, `useEventEditor`, `useEventSubmit`) — this is the pattern to follow when extending the publish flow.
- **Negocios** (businesses, Superguía): created via `src/components/Home/Negocio/`, `hooks/useNegocioForm.js`.

Both share the same moderation states (`src/lib/database/roles.js`: `ESTADOS_PUBLICACION` = `pendiente` / `publicado` / `rechazado`) and the same roles model (`ROLES` = `user` / `admin` / `moderator`). Admin review UI lives in `src/components/Admin/` (`AdminPendingList`, `AdminPublicationsList`, `AdminBusinessList`, etc.), backed by `lib/database/admin.js`.

### Subscriptions & plan rules

`src/lib/planRules.js` defines plan types (`panorama_unica`, `panorama_pack4`, `panorama_ilimitado`, `superguia`), publication limits per plan, and calendar-mode restrictions (single day / date range / specific dates). Plan state is read via `lib/database/subscriptions.js` (`getActivePublishSubscription`, `validateAndConsumePublication`, etc.) — always consume/validate publication quota server-side logic through these functions rather than trusting client state.

### Payments (Transbank Webpay Plus)

`src/lib/payment.js` calls Supabase Edge Functions (`supabase/functions/create-payment`, `confirm-payment`, `payment-status`) — real Transbank credentials and amount validation happen server-side in these Deno functions, never in the frontend. `send-email` is a separate edge function for transactional email (welcome emails, etc.), invoked via `supabase.functions.invoke(...)`.

### Auth (`src/context/AuthContext.jsx`)

Uses Supabase Auth with PKCE flow (see comments in `src/lib/supabase.js` for why implicit flow is avoided). State is managed with `useReducer` so user+role update in a single dispatch. Supports email/password and Google (both redirect and popup-with-postMessage flows). **Read the large comment block above the `onAuthStateChange` listener before touching it** — it documents a real deadlock that occurred from doing async Supabase queries directly inside that callback (Supabase's internal `navigator.locks` usage); async follow-up work must be deferred with `setTimeout(..., 0)`, not awaited inline.

### Other contexts

- `CityContext.jsx` — currently selected Maule comuna (curico/talca/linares/cauquenes), persisted to `localStorage`.
- `ToastContext.jsx` — global toast notifications, consumed by `AuthContext` for auth-related toasts.

### Routing (`src/App.jsx`)

`react-router-dom` v7. The canonical Home route is `/`; `/home`, `/panoramas` and `/superguia` are compatibility redirects. Publication screens and other infrequent routes are `lazy()`-loaded to keep the initial bundle small. Route guards: `ProtectedRoute` (auth required, optional `allowedRoles`) and `UserOnlyRoute` (restricts profile access while allowing admin/moderator publication flows). `/auth/callback` must stay registered before other routes since it handles the OAuth PKCE code exchange.

### Database schema

`database/schema.sql` is the reference/documentation schema (not applied directly). Actual schema changes go through `supabase/migrations/*.sql` — add a new timestamped migration file rather than editing schema.sql in place when changing the live DB structure.

### Build (`vite.config.js`)

Manual chunk splitting is configured for `vendor-react`, `vendor-supabase`, `vendor-icons` (FontAwesome), `vendor-charts` (recharts) — keep new heavy dependencies in mind if bundle size regresses.

### Deployment

Static build (`dist/`) is deployed to Apache/cPanel hosting: `public/.htaccess` handles HTTPS redirect and SPA fallback (rewrites unknown paths to `index.html`, excluding static asset extensions). `public/_redirects` is a legacy Netlify SPA-fallback file.
