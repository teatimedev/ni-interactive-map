# Security Fixes Applied (2026-03-22)

## ✅ COMPLETED

### Critical
- [x] **Purged `.env.local` from git history** (contained Supabase anon key)
  - Used `git filter-repo --invert-paths --path .env.local`
  - Force pushed to remote (breaks forks, but necessary)
  - Added comprehensive .env exclusions to `.gitignore`

### Medium
- [x] **IP hash salt moved to environment variable**
  - Was hardcoded as `"ni-map-salt"` in `lib/api-utils.ts`
  - Now reads from `IP_HASH_SALT` env var (fallback to old value for compatibility)
  - Add to production env: `IP_HASH_SALT=<random-32-char-hex>`

- [x] **Centralized blocked words list**
  - Was duplicated in `lib/supabase.ts` and `lib/api-utils.ts`
  - Now single source of truth in `api-utils.ts`, imported where needed

---

## 🔲 TODO (Manual Supabase Config)

### High Priority

1. **Enable Row Level Security (RLS) on all tables**
   - `map_pins`
   - `ward_tags`
   - `profiles`
   
   **RLS Policies to add:**
   ```sql
   -- profiles: users can only read/update their own
   CREATE POLICY "Users can read own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   
   -- map_pins: public read, authenticated insert, owner delete
   CREATE POLICY "Anyone can read non-reported pins"
     ON map_pins FOR SELECT
     USING (reported = false);
   
   CREATE POLICY "Authenticated users can insert pins"
     ON map_pins FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete own pins"
     ON map_pins FOR DELETE
     USING (auth.uid() = user_id);
   
   -- Similar for ward_tags
   ```

2. **Add unique constraint on `profiles.username`**
   ```sql
   ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
   ```
   
   Then update `app/api/profile/route.ts` to handle 409 conflict:
   ```typescript
   const { error } = await supabaseServer.from("profiles").insert({...});
   if (error?.code === "23505") {
     return NextResponse.json({ error: "Username already taken" }, { status: 409 });
   }
   ```

3. **Rotate Supabase anon key** (optional but recommended)
   - Keys were in public git history for ~3 days
   - Generate new anon key in Supabase dashboard
   - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production env
   - Update `.env.local` for local dev

### Medium Priority

4. **Set `IP_HASH_SALT` in production environment**
   - Generate: `openssl rand -hex 16`
   - Add to Vercel/hosting platform secrets
   - Without this, IP hashing still works but uses the old hardcoded value

5. **Add `ADMIN_EMAILS` to production env**
   - Currently loaded from env var but not documented
   - Example: `ADMIN_EMAILS=jordan@example.com,admin@example.com`

6. **Verify `SUPABASE_SERVICE_ROLE_KEY` is set in production**
   - This key is required for API routes to work
   - Should never be in `.env.local` or committed to git
   - Must be in secure hosting platform secrets only

---

## 🔒 Security Checklist for New Features

- [ ] Input validation (length, format, allowed chars)
- [ ] Rate limiting (user + IP fallback)
- [ ] Auth check on mutations (`getAuthUser()`)
- [ ] Owner/admin authorization where needed
- [ ] RLS policies updated if new tables added
- [ ] No secrets in code (use env vars)
- [ ] Blocked words filter for user-generated content

---

## 📋 Notes

- **Anon key exposure is semi-acceptable**: It's designed for client-side use and protected by RLS
- **Service role key must NEVER be exposed**: It bypasses RLS entirely
- **Defense in depth**: API routes are primary auth gate, RLS is fallback
- **IP hashing**: SHA256 with salt, for rate limiting only (not crypto purposes)
