# Next.js 14 → 15 Migration Guide

## Summary

Upgraded from Next.js `14.2.9` to `15.2.9` (latest patched release in the 15.2.x series).

> **Note on version selection:** The originally requested target was `15.2.6`, but that version carries a
> known security vulnerability (Next.js security advisory, December 2025). `15.2.9` is the latest patch
> in the same minor series and includes the fix. See https://nextjs.org/blog/security-update-2025-12-11

---

## Breaking Changes & Resolutions

### 1. `params` is now a Promise in Route Handlers

**What changed:** In Next.js 15, the `params` argument passed to API route handlers is no longer a
plain object — it is a Promise that must be awaited before destructuring.

**Pattern before (Next.js 14):**
```js
export async function GET(request, { params }) {
  const { eventID } = params; // synchronous access
}
```

**Pattern after (Next.js 15):**
```js
export async function GET(request, { params }) {
  const { eventID } = await params; // must await
}
```

**Files updated:**
| File | Handlers |
|---|---|
| `src/app/api/events/[eventID]/route.js` | `GET` |
| `src/app/api/[eventID]/guests/route.js` | `POST` |
| `src/app/api/[eventID]/guests/[guestId]/route.js` | `DELETE`, `PUT` |
| `src/app/api/[eventID]/login/route.js` | `POST` |
| `src/app/api/[eventID]/rsvp/route.js` | `GET`, `POST` |
| `src/app/api/[eventID]/sendMail/route.js` | `POST` |
| `src/app/api/[eventID]/guestList/route.js` | `GET`, `POST` |
| `src/app/api/[eventID]/updateGroupStatus/route.js` | `POST` |

**Not affected:** Client components using the `useParams()` hook (`[eventID]/portal/page.js`,
`[eventID]/rsvp/page.js`) are not affected — the async params change only applies to server-side
route handlers and server components.

---

### 2. `cookies()` from `next/headers` is now async

**What changed:** In Next.js 15, `cookies()` (and `headers()`, `draftMode()`) from `next/headers`
now return Promises. Any server utility that calls these must be made `async` and must `await` the result.

**File updated:** `src/app/utils/supabase/server.js`

**Before:**
```js
export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(...);
};
```

**After:**
```js
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(...);
};
```

Because `createClient` is now `async`, every call site that was `createClient()` must become
`await createClient()`.

**Call sites updated:**
- `src/app/api/events/route.js` (4 call sites)
- `src/app/api/events/[eventID]/route.js`
- `src/app/api/[eventID]/login/route.js`
- `src/app/api/[eventID]/rsvp/route.js` (2 call sites)
- `src/app/api/[eventID]/sendMail/route.js`
- `src/app/api/[eventID]/guestList/route.js` (2 call sites)
- `src/app/api/[eventID]/updateGroupStatus/route.js`
- `src/app/auth/callback/route.js`

---

### 3. `images.domains` is deprecated → `remotePatterns`

**What changed:** `images.domains` in `next.config.js/mjs` is deprecated in Next.js 15.
The recommended replacement is `images.remotePatterns`, which provides more granular control
(protocol, hostname, port, pathname).

**File updated:** `next.config.mjs`

**Before:**
```js
images: {
  domains: ['i.imgur.com'],
},
```

**After:**
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'i.imgur.com',
    },
  ],
},
```

---

### 4. `fetch` caching behaviour change (no code changes required)

**What changed:** In Next.js 14, `fetch()` requests in Server Components and Route Handlers were
cached by default (`cache: 'force-cache'`). In Next.js 15, the default changed to `cache: 'no-store'`.

**Impact on this project:** All API routes in this project use the Supabase JS client directly
(not `fetch`) and do not rely on Next.js automatic fetch caching. No changes were required.

If future routes use `fetch()` for external data, caching options must be set explicitly:
```js
// Opt into caching explicitly if needed
const res = await fetch(url, { cache: 'force-cache' });
// or with revalidation
const res = await fetch(url, { next: { revalidate: 3600 } });
```

---

### 5. GET Route Handlers no longer cached by default (no code changes required)

**What changed:** In Next.js 14, `GET` Route Handlers were cached by default. In Next.js 15,
they are dynamic by default (not cached).

**Impact on this project:** All GET Route Handlers in this project already generate dynamic
responses (Supabase queries, auth checks, etc.) and were not relying on Next.js route caching.
No changes were required.

---

### 6. React version (no change)

Next.js 15 ships with React 19 as the default peer dependency, but React 18 remains supported.
This project **stays on React 18** (`^18`) to avoid a separate React 19 migration. React 18 is
fully compatible with Next.js 15.

---

## Packages Changed

| Package | Before | After |
|---|---|---|
| `next` | `14.2.9` | `15.2.9` |
| `eslint-config-next` | `14.2.9` | `15.2.9` |

All other dependencies (`react`, `react-dom`, `@supabase/ssr`, etc.) are unchanged.

---

## Verification

Run the following after the migration to confirm the build succeeds:

```bash
cd frontend
npm run build
npm run lint
npm test
```
