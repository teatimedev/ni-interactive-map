# Auth, Pins, Tags & Admin — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Branch:** Will be developed in a separate git worktree

## Goal

Add user authentication, tie pins and tags to user accounts, and provide admin moderation tools — both inline on the map and via a dedicated dashboard. Anonymous browsing remains fully functional; login is only required to create or delete content.

## Authentication

### Provider
Supabase Auth — already in the stack via `@supabase/supabase-js`.

### Three sign-up paths
1. **Email + password** — full account with recovery
2. **Magic link** — passwordless via email
3. **Continue as guest** — `signInAnonymously()`, username-only, no email. Cannot recover if session is lost. Banner suggests linking an email.

### Username picker
After first auth (all paths), if no `profiles` row exists, a full-screen overlay blocks interaction until the user picks a display name.
- 3–20 characters, alphanumeric + underscores
- Must be unique (checked against `profiles` table)
- **Usernames are immutable once chosen** — avoids cascading updates across denormalized pins/tags
- Stored in `profiles` and denormalized onto `map_pins.username` and `ward_tags.username` for fast reads

### Email confirmation
Supabase email confirmation is **enabled** (default). After email+password signup, the user receives a verification email and must confirm before they can create content. They can browse the map while unconfirmed. Magic link users are confirmed automatically. Guest users skip this entirely.

### Client-side auth state
New `AuthProvider` React context wrapping the app:
- Listens to `supabase.auth.onAuthStateChange`
- Exposes: `user`, `username`, `isAdmin`, `isLoading`, `signOut`
- `isAdmin` determined via `/api/auth/me` endpoint

### Auth UI
- "Sign in" button top-right of map
- Modal with "Sign in" / "Sign up" tabs + "Continue as guest" button
- Logged-in state: small pill showing username + "Sign out"
- Pin mode and tag buttons greyed out for unauthenticated users with "Sign in to drop pins" tooltip

## Database Changes

### New table: `profiles`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK → auth.users, not null |
| username | text | unique, not null, 3-20 chars |
| created_at | timestamptz | default now() |

### Modified table: `map_pins`
Add columns:
- `user_id` (uuid, nullable — existing anonymous pins have null)
- `username` (text, nullable)

### Modified table: `ward_tags`
Add columns:
- `user_id` (uuid, nullable — existing anonymous tags have null)
- `username` (text, nullable)

### Row Level Security
- `profiles`: users can read all, insert/update own row only
- `map_pins`: anyone can read. Authenticated users can insert (with their user_id). Users can delete own pins. Admin can delete any.
- `ward_tags`: same pattern as map_pins

## API Changes

### New endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/auth/me` | Required | Returns `{ user, username, isAdmin }` |
| POST | `/api/profile` | Required | Create/update username |
| DELETE | `/api/pins` | Required | Delete pin (owner or admin) |
| DELETE | `/api/tags` | Required | Delete tag (owner or admin) |
| GET | `/api/admin/pins` | Admin | List all pins with filters |
| GET | `/api/admin/tags` | Admin | List all tags with filters |
| DELETE | `/api/admin/pins` | Admin | Bulk delete pins |
| DELETE | `/api/admin/tags` | Admin | Bulk delete tags |

### Modified endpoints
- `POST /api/pins` — requires auth, stores `user_id` + `username`, rate limit per user (3/hour) **plus** IP-based rate limit retained as secondary gate (prevents guest account spam)
- `POST /api/tags` — requires auth, stores `user_id` + `username`, rate limit per user (5/hour) **plus** IP-based rate limit retained
- `GET /api/pins` — select expanded to include `username` and `user_id` (for client-side ownership checks)
- `GET /api/tags` — select expanded to include `username` and `user_id`
- `PATCH /api/pins` — report pin, remains public (no auth required), but tied to user_id if logged in to prevent duplicate reports

### Auth helper (`lib/auth.ts`)
Server-side utility function:
- Extracts JWT from `Authorization: Bearer <token>` header (client sends `supabase.auth.getSession().access_token`)
- Verifies with Supabase server client (service role key)
- Checks email against `ADMIN_EMAILS` env var
- Returns `{ user, isAdmin }` or `null` if unauthenticated

### Shared utilities (`lib/api-utils.ts`)
Extract from existing duplicated code in pins/tags routes:
- `hashIp()`, `getClientIp()`, `BLOCKED_WORDS`, `validateLabel()`

### Delete endpoint contract
`DELETE /api/pins` and `DELETE /api/tags` accept `{ id }` in JSON body (consistent with existing PATCH pattern). Admin bulk delete at `/api/admin/*` accepts `{ ids: string[] }`.

### Migration order
1. Add new columns (`user_id`, `username`) to `map_pins` and `ward_tags` — nullable, no default
2. Create `profiles` table
3. Apply RLS policies (reads remain open, so existing data is not broken)
4. Deploy updated API routes

### Admin detection
- `ADMIN_EMAILS` environment variable (comma-separated email list)
- Checked server-side only — client gets `isAdmin` from `/api/auth/me`
- Guest accounts (no email) can never be admin

## UI Changes

### Pins
- Pin dot on map shows tiny username label below it
- Pin popup: label, username, time ago, "Report" button
- Owner sees "Delete" button on their own pin popup
- Admin sees "Delete" button on all pin popups

### Tags
- Tag chips show "by username" text or tooltip
- Adding tags requires login
- Owner or admin sees "x" delete button on tag chips

### Admin dashboard (`/admin`)
- Protected route — redirects home if not admin
- Two tabs: "Pins" and "Tags"
- Table per tab: content, username, created date, report count
- Default sort: report count descending (reported content surfaces first)
- Filters: "Reported only", "All", search by username
- Bulk select + delete
- Functional design, not fancy

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Existing |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing |
| `SUPABASE_SERVICE_ROLE_KEY` | New — for server-side auth verification |
| `ADMIN_EMAILS` | New — comma-separated admin email list |

## What stays the same
- All map browsing, district/ward navigation, stats panels, choropleth, search, compare, leaderboard
- Anonymous users can view everything — pins, tags, stats
- Existing anonymous pins and tags remain visible (null user_id)

## Out of scope
- Social OAuth providers (Google, GitHub) — can be added later
- User profile pages
- Pin/tag editing (only create and delete)
- Pin categories or colors
- Email notifications
